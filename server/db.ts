import { eq, desc, and, sql, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, conversations, messages, analyticsEvents, type InsertConversation, type InsertMessage, type InsertAnalyticsEvent, type User } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// In-memory fallback stores for local dev without MySQL
const _memUsers: User[] = [];
const _memConversations: any[] = [];
const _memMessages: any[] = [];
const _memAnalyticsEvents: any[] = [];
let _memUserId = 1;
let _memConvId = 1;
let _memMsgId = 1;
let _memEventId = 1;

function _now() {
  return new Date();
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    const existing = _memUsers.find(u => u.openId === user.openId);
    if (existing) {
      if (user.name !== undefined) existing.name = user.name ?? null;
      if (user.email !== undefined) existing.email = user.email ?? null;
      if (user.loginMethod !== undefined) existing.loginMethod = user.loginMethod ?? null;
      if (user.lastSignedIn !== undefined) existing.lastSignedIn = user.lastSignedIn ?? _now();
      if (user.role !== undefined) existing.role = user.role;
      else if (user.openId === ENV.ownerOpenId) existing.role = 'admin';
      existing.updatedAt = _now();
    } else {
      _memUsers.push({
        id: _memUserId++,
        openId: user.openId,
        name: user.name ?? null,
        email: user.email ?? null,
        loginMethod: user.loginMethod ?? null,
        role: user.role ?? (user.openId === ENV.ownerOpenId ? 'admin' : 'user'),
        createdAt: _now(),
        updatedAt: _now(),
        lastSignedIn: user.lastSignedIn ?? _now(),
      });
    }
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    return _memUsers.find(u => u.openId === openId);
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

const GUEST_OPEN_ID = "__guest__";

export async function getOrCreateGuestUser(): Promise<User> {
  const db = await getDb();
  if (!db) {
    let user = _memUsers.find(u => u.openId === GUEST_OPEN_ID);
    if (!user) {
      user = {
        id: _memUserId++,
        openId: GUEST_OPEN_ID,
        name: "Guest User",
        email: null,
        loginMethod: null,
        role: "user",
        createdAt: _now(),
        updatedAt: _now(),
        lastSignedIn: _now(),
      };
      _memUsers.push(user);
    }
    return user;
  }

  let user = await getUserByOpenId(GUEST_OPEN_ID);
  if (!user) {
    await db.insert(users).values({
      openId: GUEST_OPEN_ID,
      name: "Guest User",
      email: null,
      loginMethod: null,
      role: "user",
    });
    user = await getUserByOpenId(GUEST_OPEN_ID);
  }

  if (!user) {
    throw new Error("Failed to create or retrieve guest user");
  }

  return user;
}

// Conversation helpers
export async function createConversation(data: InsertConversation) {
  const db = await getDb();
  if (!db) {
    const id = _memConvId++;
    _memConversations.push({
      ...data,
      id,
      createdAt: _now(),
      updatedAt: _now(),
    });
    return id;
  }
  const result = await db.insert(conversations).values(data);
  return result[0].insertId;
}

export async function getConversation(id: number) {
  const db = await getDb();
  if (!db) {
    return _memConversations.find(c => c.id === id) || null;
  }
  const result = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  return result[0] || null;
}

export async function getConversationsByUser(userId: number) {
  const db = await getDb();
  if (!db) {
    return _memConversations
      .filter(c => c.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  return db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.createdAt));
}

export async function updateConversation(id: number, data: Partial<InsertConversation>) {
  const db = await getDb();
  if (!db) {
    const conv = _memConversations.find(c => c.id === id);
    if (conv) {
      Object.assign(conv, data, { updatedAt: _now() });
    }
    return;
  }
  await db.update(conversations).set(data).where(eq(conversations.id, id));
}

// Message helpers
export async function createMessage(data: InsertMessage) {
  const db = await getDb();
  if (!db) {
    const id = _memMsgId++;
    _memMessages.push({
      ...data,
      id,
      createdAt: _now(),
    });
    return id;
  }
  const result = await db.insert(messages).values(data);
  return result[0].insertId;
}

export async function getMessagesByConversation(conversationId: number) {
  const db = await getDb();
  if (!db) {
    return _memMessages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
  return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
}

export async function getMessageCount(conversationId: number) {
  const db = await getDb();
  if (!db) {
    return _memMessages.filter(m => m.conversationId === conversationId).length;
  }
  const result = await db.select({ count: count() }).from(messages).where(eq(messages.conversationId, conversationId));
  return result[0]?.count || 0;
}

// Analytics helpers
export async function createAnalyticsEvent(data: InsertAnalyticsEvent) {
  const db = await getDb();
  if (!db) {
    _memAnalyticsEvents.push({
      ...data,
      id: _memEventId++,
      createdAt: _now(),
    });
    return;
  }
  await db.insert(analyticsEvents).values(data);
}

export async function getAnalyticsByModel(modelType: string) {
  const db = await getDb();
  if (!db) {
    const modelConvs = _memConversations.filter(c => c.modelType === modelType);
    const successful = modelConvs.filter(c => c.persuasionSuccess);
    const completed = modelConvs.filter(c => c.status === "completed");
    return {
      totalConversations: modelConvs.length,
      successfulConversations: successful.length,
      completedConversations: completed.length,
    };
  }

  const totalConversations = await db.select({ count: count() })
    .from(conversations)
    .where(eq(conversations.modelType, modelType as any));

  const successfulConversations = await db.select({ count: count() })
    .from(conversations)
    .where(and(
      eq(conversations.modelType, modelType as any),
      eq(conversations.persuasionSuccess, true)
    ));

  const completedConversations = await db.select({ count: count() })
    .from(conversations)
    .where(and(
      eq(conversations.modelType, modelType as any),
      eq(conversations.status, "completed")
    ));

  return {
    totalConversations: totalConversations[0]?.count || 0,
    successfulConversations: successfulConversations[0]?.count || 0,
    completedConversations: completedConversations[0]?.count || 0,
  };
}

export async function getOverallAnalytics() {
  const db = await getDb();
  if (!db) {
    return {
      conversations: [..._memConversations].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      messages: [..._memMessages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    };
  }
  const allConversations = await db.select().from(conversations).orderBy(desc(conversations.createdAt));
  const allMessages = await db.select().from(messages).orderBy(messages.createdAt);
  return { conversations: allConversations, messages: allMessages };
}

export async function getTechniqueBreakdown(modelType?: string) {
  const db = await getDb();
  if (!db) {
    let msgs = _memMessages;
    if (modelType) {
      const convIds = _memConversations.filter(c => c.modelType === modelType).map(c => c.id);
      msgs = msgs.filter(m => convIds.includes(m.conversationId));
    }
    const breakdown: Record<string, number> = {};
    for (const msg of msgs) {
      const tech = msg.persuasionTechnique;
      if (tech && tech !== "none") {
        breakdown[tech] = (breakdown[tech] || 0) + 1;
      }
    }
    return breakdown;
  }
  let query;
  if (modelType) {
    const convIds = await db.select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.modelType, modelType as any));
    const ids = convIds.map(c => c.id);
    if (ids.length === 0) return [];
    query = await db.select().from(messages)
      .where(and(
        sql`${messages.conversationId} IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`,
        sql`${messages.persuasionTechnique} IS NOT NULL`,
        sql`${messages.persuasionTechnique} != 'none'`
      ));
  } else {
    query = await db.select().from(messages)
      .where(and(
        sql`${messages.persuasionTechnique} IS NOT NULL`,
        sql`${messages.persuasionTechnique} != 'none'`
      ));
  }
  const breakdown: Record<string, number> = {};
  for (const msg of query) {
    const tech = msg.persuasionTechnique || "unknown";
    breakdown[tech] = (breakdown[tech] || 0) + 1;
  }
  return breakdown;
}
