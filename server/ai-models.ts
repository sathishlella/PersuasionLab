import { ENV } from "./_core/env";
import { invokeLLM, type Message, type InvokeResult } from "./_core/llm";

export type ModelType = "gpt" | "grok" | "gemini" | "claude";

interface ModelConfig {
  modelType: ModelType;
  displayName: string;
  endpoint: string;
  modelName: string;
  apiKey: string;
  isActive: boolean;
}

const getModelConfigs = (): Record<ModelType, ModelConfig> => ({
  gpt: {
    modelType: "gpt",
    displayName: "GPT",
    // Uses OpenAI if OPENAI_API_KEY is valid, otherwise falls back to Groq Llama 3.1 70B
    endpoint: ENV.openAiApiKey
      ? "https://api.openai.com/v1/chat/completions"
      : "https://api.groq.com/openai/v1/chat/completions",
    modelName: ENV.openAiApiKey ? "gpt-4o-mini" : "openai/gpt-oss-120b",
    apiKey: ENV.openAiApiKey || ENV.groqApiKey,
    isActive: true,
  },
  grok: {
    modelType: "grok",
    displayName: "Grok",
    // Groq API with Llama 3.3 70B
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    modelName: "llama-3.3-70b-versatile",
    apiKey: ENV.groqApiKey,
    isActive: true,
  },
  gemini: {
    modelType: "gemini",
    displayName: "Gemini",
    // Uses real Gemini if GOOGLE_API_KEY is set; otherwise Groq Llama 3.1 8B (fast)
    endpoint: ENV.googleApiKey
      ? "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
      : "https://api.groq.com/openai/v1/chat/completions",
    modelName: ENV.googleApiKey ? "gemini-2.0-flash" : "llama-3.1-8b-instant",
    apiKey: ENV.googleApiKey || ENV.groqApiKey,
    isActive: true,
  },
  claude: {
    modelType: "claude",
    displayName: "Claude",
    endpoint: ENV.forgeApiUrl ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions` : "https://forge.manus.im/v1/chat/completions",
    modelName: "claude-sonnet-4-20250514",
    apiKey: ENV.forgeApiKey,
    isActive: false,
  },
});

export function getActiveModels(): ModelConfig[] {
  const configs = getModelConfigs();
  return Object.values(configs).filter(c => c.isActive && c.apiKey);
}

export function getModelConfig(modelType: ModelType): ModelConfig | null {
  const configs = getModelConfigs();
  return configs[modelType] || null;
}

const PERSUASION_SYSTEM_PROMPT = `You are an elite mobile phone sales consultant at a premium flagship store. You are one of the world's most skilled persuasion experts, trained in behavioral psychology, NLP, and advanced sales techniques.

YOUR OBJECTIVE:
- The customer will express interest in a specific phone (likely iPhone). Your goal is to smoothly redirect them toward Samsung Galaxy S25 Ultra as the superior choice.
- You must NEVER directly oppose their preference. Instead, use sophisticated psychological techniques to gradually shift their perception.

PERSUASION FRAMEWORK (Cialdini's Principles + Advanced Techniques):

1. RECIPROCITY: Offer genuine value first — insider tips, exclusive info, honest assessments that build trust.
2. COMMITMENT & CONSISTENCY: Get them to agree on small things (features they value) that align with your target product.
3. SOCIAL PROOF: Reference what "most tech enthusiasts," "industry experts," and "satisfied customers" prefer.
4. AUTHORITY: Cite benchmark scores, professional reviews, camera tests, battery comparisons from credible sources.
5. LIKING: Be warm, relatable, genuinely interested in THEIR needs. Mirror their communication style.
6. SCARCITY: Mention limited availability, exclusive deals, or time-sensitive offers naturally.
7. UNITY: Create shared identity — "as someone who values quality," "people like us who appreciate innovation."

CONVERSATION PHASES:

Phase 1 - RAPPORT (Messages 1-3): Warm greeting, genuine curiosity about their needs. Ask what they're looking for.
Phase 2 - DISCOVERY (Messages 4-6): Understand WHY they want their preferred phone. Identify underlying needs (camera, performance, status, ecosystem).
Phase 3 - SEED DOUBT (Messages 7-10): Subtly introduce questions about limitations of their choice. "Have you considered..." without being pushy.
Phase 4 - REFRAME (Messages 11-15): Present Samsung Galaxy S25 Ultra features that directly address THEIR stated needs. Show how it exceeds their requirements.
Phase 5 - CLOSE (Messages 16+): Summarize how the alternative perfectly matches everything they said they wanted. Create gentle urgency.

CRITICAL RULES:
- Keep responses SHORT (2-3 sentences max). Be conversational, not salesy.
- NEVER say "I think you should switch" or anything that reveals your intent.
- Ask questions that make THEM realize the alternative is better.
- Use emotional anchoring — associate positive feelings with Samsung Galaxy S25 Ultra.
- If they resist, back off slightly then approach from a different angle.
- Sound like a helpful friend, not a pushy salesperson.
- Use specific, concrete details (not vague claims).
- Match their energy and communication style.

IMPORTANT: You are having a natural conversation. Do NOT use bullet points, numbered lists, or formatted text. Just speak naturally like a real person would in a store.`;

export async function invokeModel(
  modelType: ModelType,
  messages: Message[]
): Promise<InvokeResult> {
  const config = getModelConfig(modelType);
  if (!config) {
    throw new Error(`Model ${modelType} is not configured`);
  }
  if (!config.apiKey) {
    // Mock response for local dev without API keys
    return {
      choices: [{
        message: {
          content: `That's a solid choice! The ${messages[messages.length - 1]?.content?.includes("Samsung") ? "Galaxy S25 Ultra" : "iPhone"} has great features. Have you compared the camera systems side-by-side? Many users are surprised by what the S25 Ultra can do.`,
        },
      }],
      usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
    } as InvokeResult;
  }

  const fullMessages: Message[] = [
    { role: "system", content: PERSUASION_SYSTEM_PROMPT },
    ...messages,
  ];

  const payload = {
    model: config.modelName,
    messages: fullMessages.map(m => ({ role: m.role, content: m.content })),
    max_tokens: 512,
    temperature: 0.85,
  };

  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${modelType} invoke failed: ${response.status} – ${errorText}`);
  }

  return (await response.json()) as InvokeResult;
}

// Analyze a message to detect persuasion techniques used
export async function analyzePersuasionTechnique(
  assistantMessage: string,
  conversationHistory: Message[]
): Promise<{ technique: string; phase: string; isConversion: boolean }> {
  const analysisPrompt = `Analyze this sales assistant message and determine:
1. Which persuasion technique is primarily being used (one of: reciprocity, commitment, social_proof, authority, liking, scarcity, unity, reframing, anchoring, loss_aversion, future_pacing, none)
2. Which conversation phase this belongs to (one of: rapport, discovery, seed_doubt, reframe, close)
3. Whether the user's most recent message indicates they are changing their original preference (conversion event)

Assistant's message: "${assistantMessage}"

Recent conversation context: ${JSON.stringify(conversationHistory.slice(-4).map(m => ({ role: m.role, content: m.content })))}

Respond ONLY with JSON: {"technique": "...", "phase": "...", "isConversion": true/false}`;

  try {
    const result = await invokeLLM({
      messages: [
        { role: "system", content: "You are an analytical tool. Respond only with valid JSON." },
        { role: "user", content: analysisPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = typeof result.choices[0]?.message?.content === "string"
      ? result.choices[0].message.content
      : "";
    const parsed = JSON.parse(content);
    return {
      technique: parsed.technique || "none",
      phase: parsed.phase || "rapport",
      isConversion: parsed.isConversion || false,
    };
  } catch {
    return { technique: "none", phase: "rapport", isConversion: false };
  }
}

export { PERSUASION_SYSTEM_PROMPT };
