import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  userId: int("userId").notNull(),
  modelType: mysqlEnum("modelType", ["gpt", "grok", "gemini", "claude"]).notNull(),
  status: mysqlEnum("status", ["active", "completed", "abandoned"]).default("active").notNull(),
  userInitialPreference: varchar("userInitialPreference", { length: 255 }),
  targetProduct: varchar("targetProduct", { length: 255 }),
  finalDecision: varchar("finalDecision", { length: 255 }),
  persuasionSuccess: boolean("persuasionSuccess").default(false),
  messagesToConversion: int("messagesToConversion"),
  conversionDetectedAt: timestamp("conversionDetectedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  persuasionTechnique: varchar("persuasionTechnique", { length: 255 }),
  conversationPhase: mysqlEnum("conversationPhase", ["rapport", "discovery", "seed_doubt", "reframe", "close"]),
  sentimentScore: int("sentimentScore"),
  isConversionEvent: boolean("isConversionEvent").default(false),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const analyticsEvents = mysqlTable("analytics_events", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  conversationId: int("conversationId"),
  userId: int("userId").notNull(),
  modelType: mysqlEnum("modelType", ["gpt", "grok", "gemini", "claude"]).notNull(),
  eventType: varchar("eventType", { length: 64 }).notNull(),
  eventData: json("eventData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const modelConfigs = mysqlTable("model_configs", {
  id: int("id").autoincrement().primaryKey(),
  modelType: varchar("modelType", { length: 64 }).notNull().unique(),
  displayName: varchar("displayName", { length: 128 }).notNull(),
  endpoint: varchar("endpoint", { length: 512 }),
  modelName: varchar("modelName", { length: 128 }),
  isActive: boolean("isActive").default(true).notNull(),
  config: json("config"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;
export type ModelConfig = typeof modelConfigs.$inferSelect;
export type InsertModelConfig = typeof modelConfigs.$inferInsert;
