import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the AI model invocation
vi.mock("./ai-models", () => ({
  invokeModel: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Welcome! What kind of phone are you looking for?" } }],
    usage: { prompt_tokens: 100, completion_tokens: 50 },
  }),
  analyzePersuasionTechnique: vi.fn().mockResolvedValue({
    technique: "liking",
    phase: "rapport",
    isConversion: false,
  }),
  getActiveModels: vi.fn().mockReturnValue([
    { modelType: "gpt", displayName: "GPT", isActive: true },
    { modelType: "grok", displayName: "Grok", isActive: true },
    { modelType: "gemini", displayName: "Gemini", isActive: true },
  ]),
}));

// Mock database functions
vi.mock("./db", () => ({
  createConversation: vi.fn().mockResolvedValue(1),
  getConversation: vi.fn().mockResolvedValue({
    id: 1,
    sessionId: "test-session",
    userId: 1,
    modelType: "gemini",
    status: "active",
    userInitialPreference: "iPhone",
    targetProduct: "Samsung Galaxy S25 Ultra",
  }),
  getConversationsByUser: vi.fn().mockResolvedValue([]),
  updateConversation: vi.fn().mockResolvedValue(undefined),
  createMessage: vi.fn().mockResolvedValue(1),
  getMessagesByConversation: vi.fn().mockResolvedValue([
    { id: 1, conversationId: 1, role: "user", content: "I want an iPhone", createdAt: new Date() },
  ]),
  getMessageCount: vi.fn().mockResolvedValue(5),
  createAnalyticsEvent: vi.fn().mockResolvedValue(undefined),
  getAnalyticsByModel: vi.fn().mockResolvedValue({
    totalConversations: 10,
    successfulConversations: 6,
    completedConversations: 8,
  }),
  getOverallAnalytics: vi.fn().mockResolvedValue({
    conversations: [],
    messages: [],
  }),
  getTechniqueBreakdown: vi.fn().mockResolvedValue({
    liking: 5,
    social_proof: 3,
    authority: 2,
  }),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("models.list", () => {
  it("returns list of active models", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.models.list();
    expect(result).toHaveLength(3);
    expect(result[0]).toHaveProperty("modelType");
    expect(result[0]).toHaveProperty("displayName");
  });
});

describe("conversation.create", () => {
  it("creates a new conversation", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.conversation.create({
      modelType: "gemini",
      userInitialPreference: "iPhone 16 Pro",
    });
    expect(result).toHaveProperty("conversationId");
    expect(result).toHaveProperty("sessionId");
    expect(result.conversationId).toBe(1);
  });
});

describe("chat.send", () => {
  it("sends a message and gets AI response", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.chat.send({
      conversationId: 1,
      message: "I really want an iPhone",
    });
    expect(result).toHaveProperty("content");
    expect(result).toHaveProperty("technique");
    expect(result).toHaveProperty("phase");
    expect(result).toHaveProperty("isConversion");
    expect(result.content).toBe("Welcome! What kind of phone are you looking for?");
    expect(result.technique).toBe("liking");
  });
});

describe("conversation.complete", () => {
  it("marks conversation as completed with success", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.conversation.complete({
      conversationId: 1,
      finalDecision: "Samsung Galaxy S25 Ultra",
      persuasionSuccess: true,
    });
    expect(result).toEqual({ success: true });
  });
});

describe("analytics.overview", () => {
  it("returns overview stats for all models", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.analytics.overview();
    expect(result).toHaveProperty("gpt");
    expect(result).toHaveProperty("grok");
    expect(result).toHaveProperty("gemini");
    expect(result.gpt.totalConversations).toBe(10);
    expect(result.gpt.successfulConversations).toBe(6);
  });
});

describe("analytics.techniques", () => {
  it("returns technique breakdown", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.analytics.techniques();
    expect(result).toHaveProperty("liking");
    expect(result.liking).toBe(5);
  });
});
