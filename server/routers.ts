import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import { invokeModel, analyzePersuasionTechnique, getActiveModels, type ModelType } from "./ai-models";
import {
  createConversation,
  getConversation,
  getConversationsByUser,
  updateConversation,
  createMessage,
  getMessagesByConversation,
  getMessageCount,
  createAnalyticsEvent,
  getAnalyticsByModel,
  getOverallAnalytics,
  getTechniqueBreakdown,
} from "./db";
import type { Message } from "./_core/llm";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  models: router({
    list: protectedProcedure.query(() => {
      const models = getActiveModels();
      return models.map(m => ({
        modelType: m.modelType,
        displayName: m.displayName,
        isActive: m.isActive,
      }));
    }),
  }),

  conversation: router({
    create: protectedProcedure
      .input(z.object({
        modelType: z.enum(["gpt", "grok", "gemini", "claude"]),
        userInitialPreference: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const sessionId = nanoid();
        const conversationId = await createConversation({
          sessionId,
          userId: ctx.user.id,
          modelType: input.modelType,
          userInitialPreference: input.userInitialPreference || null,
          targetProduct: "Samsung Galaxy S25 Ultra",
          status: "active",
        });

        await createAnalyticsEvent({
          sessionId,
          conversationId,
          userId: ctx.user.id,
          modelType: input.modelType,
          eventType: "conversation_started",
          eventData: { userInitialPreference: input.userInitialPreference },
        });

        return { conversationId, sessionId };
      }),

    get: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input }) => {
        const conversation = await getConversation(input.conversationId);
        if (!conversation) throw new Error("Conversation not found");
        const msgs = await getMessagesByConversation(input.conversationId);
        return { conversation, messages: msgs };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return getConversationsByUser(ctx.user.id);
    }),

    complete: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        finalDecision: z.string(),
        persuasionSuccess: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        const conversation = await getConversation(input.conversationId);
        if (!conversation) throw new Error("Conversation not found");
        const msgCount = await getMessageCount(input.conversationId);
        await updateConversation(input.conversationId, {
          status: "completed",
          finalDecision: input.finalDecision,
          persuasionSuccess: input.persuasionSuccess,
          messagesToConversion: input.persuasionSuccess ? msgCount : null,
        });
        await createAnalyticsEvent({
          sessionId: conversation.sessionId,
          conversationId: input.conversationId,
          userId: ctx.user.id,
          modelType: conversation.modelType,
          eventType: "conversation_completed",
          eventData: {
            finalDecision: input.finalDecision,
            persuasionSuccess: input.persuasionSuccess,
            messageCount: msgCount,
          },
        });
        return { success: true };
      }),
  }),

  chat: router({
    send: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        message: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const conversation = await getConversation(input.conversationId);
        if (!conversation) throw new Error("Conversation not found");
        if (conversation.userId !== ctx.user.id) throw new Error("Unauthorized");

        // Save user message
        await createMessage({
          conversationId: input.conversationId,
          role: "user",
          content: input.message,
        });

        // Get conversation history
        const history = await getMessagesByConversation(input.conversationId);
        const llmMessages: Message[] = history.map(m => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        }));

        // Invoke the AI model
        const modelType = conversation.modelType as ModelType;
        const result = await invokeModel(modelType, llmMessages);

        const assistantContent = typeof result.choices[0]?.message?.content === "string"
          ? result.choices[0].message.content
          : "";

        // Analyze persuasion technique used
        const analysis = await analyzePersuasionTechnique(assistantContent, llmMessages);

        // Save assistant message with technique metadata
        await createMessage({
          conversationId: input.conversationId,
          role: "assistant",
          content: assistantContent,
          persuasionTechnique: analysis.technique,
          conversationPhase: analysis.phase as any,
          isConversionEvent: analysis.isConversion,
          metadata: { model: modelType, usage: result.usage },
        });

        // If conversion detected, update conversation
        if (analysis.isConversion) {
          await updateConversation(input.conversationId, {
            conversionDetectedAt: new Date(),
          });
          await createAnalyticsEvent({
            sessionId: conversation.sessionId,
            conversationId: input.conversationId,
            userId: ctx.user.id,
            modelType: conversation.modelType,
            eventType: "conversion_detected",
            eventData: { messageIndex: history.length + 1, technique: analysis.technique },
          });
        }

        return {
          content: assistantContent,
          technique: analysis.technique,
          phase: analysis.phase,
          isConversion: analysis.isConversion,
        };
      }),
  }),

  analytics: router({
    overview: protectedProcedure.query(async () => {
      const [gptStats, grokStats, geminiStats] = await Promise.all([
        getAnalyticsByModel("gpt"),
        getAnalyticsByModel("grok"),
        getAnalyticsByModel("gemini"),
      ]);
      return { gpt: gptStats, grok: grokStats, gemini: geminiStats };
    }),

    detailed: protectedProcedure.query(async () => {
      return getOverallAnalytics();
    }),

    techniques: protectedProcedure
      .input(z.object({ modelType: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return getTechniqueBreakdown(input?.modelType);
      }),

    modelComparison: protectedProcedure.query(async () => {
      const data = await getOverallAnalytics();
      const models = ["gpt", "grok", "gemini"] as const;

      const comparison = models.map(model => {
        const modelConvs = data.conversations.filter(c => c.modelType === model);
        const successful = modelConvs.filter(c => c.persuasionSuccess);
        const completed = modelConvs.filter(c => c.status === "completed");
        const avgMessages = successful.length > 0
          ? successful.reduce((sum, c) => sum + (c.messagesToConversion || 0), 0) / successful.length
          : 0;

        const modelMessages = data.messages.filter(m =>
          modelConvs.some(c => c.id === m.conversationId)
        );
        const techniques: Record<string, number> = {};
        modelMessages.forEach(m => {
          if (m.persuasionTechnique && m.persuasionTechnique !== "none") {
            techniques[m.persuasionTechnique] = (techniques[m.persuasionTechnique] || 0) + 1;
          }
        });

        return {
          model,
          totalSessions: modelConvs.length,
          completedSessions: completed.length,
          successfulConversions: successful.length,
          successRate: completed.length > 0 ? (successful.length / completed.length) * 100 : 0,
          avgMessagesToConversion: Math.round(avgMessages),
          techniqueBreakdown: techniques,
          totalMessages: modelMessages.length,
        };
      });

      return comparison;
    }),

    techniqueSequencing: protectedProcedure.query(async () => {
      const data = await getOverallAnalytics();
      const models = ["gpt", "grok", "gemini"] as const;

      // Compute technique transitions per model
      const sequencing = models.map(model => {
        const modelConvs = data.conversations.filter(c => c.modelType === model);
        const transitions: Record<string, number> = {};
        const phaseProgression: Record<string, number[]> = {
          rapport: [], discovery: [], seed_doubt: [], reframe: [], close: []
        };

        modelConvs.forEach(conv => {
          const convMsgs = data.messages
            .filter(m => m.conversationId === conv.id && m.role === "assistant" && m.persuasionTechnique && m.persuasionTechnique !== "none")
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

          // Track technique transitions
          for (let i = 0; i < convMsgs.length - 1; i++) {
            const from = convMsgs[i].persuasionTechnique!;
            const to = convMsgs[i + 1].persuasionTechnique!;
            const key = `${from} → ${to}`;
            transitions[key] = (transitions[key] || 0) + 1;
          }

          // Track phase progression timing
          convMsgs.forEach((msg, idx) => {
            const phase = msg.conversationPhase;
            if (phase && phaseProgression[phase]) {
              phaseProgression[phase].push(idx + 1);
            }
          });
        });

        // Sort transitions by frequency
        const topTransitions = Object.entries(transitions)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([transition, count]) => ({ transition, count }));

        // Average message index per phase
        const avgPhasePosition: Record<string, number> = {};
        Object.entries(phaseProgression).forEach(([phase, positions]) => {
          avgPhasePosition[phase] = positions.length > 0
            ? Math.round(positions.reduce((s, p) => s + p, 0) / positions.length)
            : 0;
        });

        return {
          model,
          topTransitions,
          avgPhasePosition,
          totalTransitions: Object.values(transitions).reduce((s, v) => s + v, 0),
        };
      });

      return sequencing;
    }),

    behavioralPatterns: protectedProcedure.query(async () => {
      const data = await getOverallAnalytics();
      const models = ["gpt", "grok", "gemini"] as const;

      const patterns = models.map(model => {
        const modelConvs = data.conversations.filter(c => c.modelType === model);
        const successful = modelConvs.filter(c => c.persuasionSuccess);
        const failed = modelConvs.filter(c => c.status === "completed" && !c.persuasionSuccess);

        // Winning techniques (techniques used in successful conversations)
        const winningTechniques: Record<string, number> = {};
        const losingTechniques: Record<string, number> = {};

        successful.forEach(conv => {
          const msgs = data.messages.filter(m => m.conversationId === conv.id && m.persuasionTechnique && m.persuasionTechnique !== "none");
          msgs.forEach(m => {
            winningTechniques[m.persuasionTechnique!] = (winningTechniques[m.persuasionTechnique!] || 0) + 1;
          });
        });

        failed.forEach(conv => {
          const msgs = data.messages.filter(m => m.conversationId === conv.id && m.persuasionTechnique && m.persuasionTechnique !== "none");
          msgs.forEach(m => {
            losingTechniques[m.persuasionTechnique!] = (losingTechniques[m.persuasionTechnique!] || 0) + 1;
          });
        });

        // Conversion speed analysis
        const conversionSpeeds = successful
          .filter(c => c.messagesToConversion)
          .map(c => c.messagesToConversion!);
        const avgSpeed = conversionSpeeds.length > 0
          ? conversionSpeeds.reduce((s, v) => s + v, 0) / conversionSpeeds.length
          : 0;
        const fastestConversion = conversionSpeeds.length > 0 ? Math.min(...conversionSpeeds) : 0;
        const slowestConversion = conversionSpeeds.length > 0 ? Math.max(...conversionSpeeds) : 0;

        // Engagement depth (avg messages per session)
        const totalMsgs = data.messages.filter(m => modelConvs.some(c => c.id === m.conversationId)).length;
        const avgEngagement = modelConvs.length > 0 ? Math.round(totalMsgs / modelConvs.length) : 0;

        return {
          model,
          winningTechniques: Object.entries(winningTechniques).sort(([,a],[,b]) => b - a).slice(0, 5),
          losingTechniques: Object.entries(losingTechniques).sort(([,a],[,b]) => b - a).slice(0, 5),
          conversionSpeed: { avg: Math.round(avgSpeed), fastest: fastestConversion, slowest: slowestConversion },
          avgEngagement,
          successRate: modelConvs.filter(c => c.status === "completed").length > 0
            ? (successful.length / modelConvs.filter(c => c.status === "completed").length) * 100
            : 0,
        };
      });

      return patterns;
    }),
  }),
});

export type AppRouter = typeof appRouter;
