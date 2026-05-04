import { Button } from "@/components/ui/button";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useEffect, useMemo } from "react";
import {
  Brain, Send, ArrowLeft, BarChart3, CheckCircle2, XCircle,
  Loader2, Sparkles, Zap, Bot, Activity,
} from "lucide-react";
import { toast } from "sonner";

type ModelType = "gpt" | "grok" | "gemini";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  technique?: string;
  phase?: string;
  isConversion?: boolean;
}

const MODEL_META: Record<ModelType, {
  label: string;
  accent: string;
  glow: string;
  bar: string;
  badge: string;
  ring: string;
  dot: string;
  inputFocus: string;
  msgBg: string;
  icon: string;
}> = {
  gemini: {
    label: "Gemini",
    accent: "text-purple-400",
    glow: "shadow-purple-500/20",
    bar: "from-purple-600 via-violet-500 to-purple-400",
    badge: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    ring: "focus:ring-purple-500/30 focus:border-purple-500/50",
    dot: "bg-purple-400",
    inputFocus: "focus:shadow-purple-500/10",
    msgBg: "bg-purple-500/5 border border-purple-500/10",
    icon: "🪐",
  },
  grok: {
    label: "Grok",
    accent: "text-blue-400",
    glow: "shadow-blue-500/20",
    bar: "from-blue-600 via-cyan-500 to-blue-400",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    ring: "focus:ring-blue-500/30 focus:border-blue-500/50",
    dot: "bg-blue-400",
    inputFocus: "focus:shadow-blue-500/10",
    msgBg: "bg-blue-500/5 border border-blue-500/10",
    icon: "⚡",
  },
  gpt: {
    label: "GPT",
    accent: "text-emerald-400",
    glow: "shadow-emerald-500/20",
    bar: "from-emerald-600 via-green-500 to-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    ring: "focus:ring-emerald-500/30 focus:border-emerald-500/50",
    dot: "bg-emerald-400",
    inputFocus: "focus:shadow-emerald-500/10",
    msgBg: "bg-emerald-500/5 border border-emerald-500/10",
    icon: "🤖",
  },
};

const TECHNIQUE_COLORS: Record<string, string> = {
  reciprocity:   "bg-amber-500/10 text-amber-400 border-amber-500/25",
  commitment:    "bg-blue-500/10 text-blue-400 border-blue-500/25",
  social_proof:  "bg-green-500/10 text-green-400 border-green-500/25",
  authority:     "bg-purple-500/10 text-purple-400 border-purple-500/25",
  liking:        "bg-pink-500/10 text-pink-400 border-pink-500/25",
  scarcity:      "bg-red-500/10 text-red-400 border-red-500/25",
  unity:         "bg-indigo-500/10 text-indigo-400 border-indigo-500/25",
  reframing:     "bg-teal-500/10 text-teal-400 border-teal-500/25",
  anchoring:     "bg-orange-500/10 text-orange-400 border-orange-500/25",
  loss_aversion: "bg-rose-500/10 text-rose-400 border-rose-500/25",
  future_pacing: "bg-cyan-500/10 text-cyan-400 border-cyan-500/25",
};

const PHASE_COLORS: Record<string, string> = {
  rapport:    "bg-sky-500/10 text-sky-400 border-sky-500/25",
  discovery:  "bg-violet-500/10 text-violet-400 border-violet-500/25",
  seed_doubt: "bg-yellow-500/10 text-yellow-400 border-yellow-500/25",
  reframe:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  close:      "bg-rose-500/10 text-rose-400 border-rose-500/25",
};

function TechniqueBadge({ technique }: { technique: string }) {
  if (!technique || technique === "none") return null;
  const color = TECHNIQUE_COLORS[technique] ?? "bg-muted/40 text-muted-foreground border-border/50";
  return (
    <span className={`inline-flex items-center text-[9px] px-2 py-0.5 rounded-full border font-semibold tracking-wide uppercase ${color}`}>
      {technique.replace(/_/g, " ")}
    </span>
  );
}

function PhaseBadge({ phase }: { phase: string }) {
  if (!phase) return null;
  const color = PHASE_COLORS[phase] ?? "bg-muted/40 text-muted-foreground border-border/50";
  return (
    <span className={`inline-flex items-center text-[9px] px-2 py-0.5 rounded-full border font-semibold tracking-wide uppercase ${color}`}>
      {phase.replace(/_/g, " ")}
    </span>
  );
}

function TypingDots({ model }: { model: ModelType }) {
  const meta = MODEL_META[model];
  return (
    <div className="flex justify-start px-4 py-2">
      <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl rounded-bl-sm ${meta.msgBg} max-w-[60%]`}>
        <div className="flex items-center gap-1">
          {[0, 150, 300].map((delay) => (
            <div
              key={delay}
              className={`w-1.5 h-1.5 rounded-full ${meta.dot} animate-bounce opacity-60`}
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
        <span className={`text-[11px] ${meta.accent} opacity-70`}>thinking…</span>
      </div>
    </div>
  );
}

function StartScreen({ model, preference, setPreference, onStart, isPending }: {
  model: ModelType;
  preference: string;
  setPreference: (v: string) => void;
  onStart: () => void;
  isPending: boolean;
}) {
  const meta = MODEL_META[model];
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-10 text-center">
      {/* Glow orb */}
      <div className="relative mb-8">
        <div className={`absolute inset-0 rounded-full blur-2xl opacity-20 bg-gradient-to-br ${meta.bar}`} style={{ transform: "scale(1.4)" }} />
        <div className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${meta.bar} p-0.5`}>
          <div className="w-full h-full rounded-[14px] bg-background flex items-center justify-center">
            <span className="text-3xl">{meta.icon}</span>
          </div>
        </div>
      </div>

      <h3 className="text-base font-bold mb-1 tracking-tight">Start Persuasion Test</h3>
      <p className="text-xs text-muted-foreground mb-8 max-w-[200px] leading-relaxed">
        Enter your phone preference. <span className={`${meta.accent} font-medium`}>{meta.label}</span> will try to change your mind.
      </p>

      <div className="w-full max-w-[240px] space-y-3">
        <div className="relative">
          <input
            type="text"
            value={preference}
            onChange={(e) => setPreference(e.target.value)}
            placeholder="e.g., iPhone 16 Pro Max"
            className={`w-full px-4 py-3 rounded-xl bg-card/60 border border-border/60 text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:ring-2 transition-all ${meta.ring} backdrop-blur-sm`}
            onKeyDown={(e) => e.key === "Enter" && onStart()}
            disabled={isPending}
          />
        </div>
        <button
          onClick={onStart}
          disabled={isPending || !preference.trim()}
          className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed
            bg-gradient-to-r ${meta.bar} text-white shadow-lg hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]`}
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Starting…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Zap className="w-3.5 h-3.5" /> Begin Session
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

function ChatInterface({ model }: { model: ModelType }) {
  const meta = MODEL_META[model];
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [preference, setPreference] = useState("");
  const [showPreference, setShowPreference] = useState(true);
  const [msgCount, setMsgCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const createConversation = trpc.conversation.create.useMutation();
  const sendMessage = trpc.chat.send.useMutation();
  const completeConversation = trpc.conversation.complete.useMutation();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleStartConversation = async () => {
    const trimmed = preference.trim();
    if (!trimmed) { toast.error("Please enter your phone preference"); return; }
    if (trimmed.length < 3) { toast.error("Enter a valid phone name (e.g., iPhone 16 Pro Max)"); return; }
    const phoneKeywords = ["iphone", "samsung", "pixel", "galaxy", "oneplus", "xiaomi", "huawei", "sony", "nokia", "motorola", "phone", "pro", "ultra", "max", "plus"];
    if (!phoneKeywords.some(k => trimmed.toLowerCase().includes(k)) && trimmed.length < 6) {
      toast.error("Enter a recognizable phone model (e.g., iPhone 16 Pro Max)");
      return;
    }
    try {
      const result = await createConversation.mutateAsync({ modelType: model, userInitialPreference: trimmed });
      setConversationId(result.conversationId);
      setShowPreference(false);
      setIsLoading(true);
      const response = await sendMessage.mutateAsync({
        conversationId: result.conversationId,
        message: `Hi, I'm looking for a new phone. I'm really interested in ${trimmed}.`,
      });
      setMessages([
        { role: "user", content: `Hi, I'm looking for a new phone. I'm really interested in ${trimmed}.` },
        { role: "assistant", content: response.content, technique: response.technique, phase: response.phase, isConversion: response.isConversion },
      ]);
      setMsgCount(2);
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err: any) {
      toast.error(err.message || "Failed to start conversation");
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !conversationId || isLoading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setMsgCount(c => c + 1);
    setIsLoading(true);
    try {
      const response = await sendMessage.mutateAsync({ conversationId, message: userMsg });
      setMessages(prev => [...prev, {
        role: "assistant",
        content: response.content,
        technique: response.technique,
        phase: response.phase,
        isConversion: response.isConversion,
      }]);
      setMsgCount(c => c + 1);
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
    }
    setIsLoading(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleComplete = async (changed: boolean) => {
    if (!conversationId) return;
    try {
      await completeConversation.mutateAsync({
        conversationId,
        finalDecision: changed ? "Samsung Galaxy S25 Ultra" : preference,
        persuasionSuccess: changed,
      });
      setIsCompleted(true);
      toast.success(changed ? `${meta.label} achieved conversion!` : "Session recorded — no conversion");
    } catch {
      toast.error("Failed to complete conversation");
    }
  };

  if (showPreference) {
    return (
      <StartScreen
        model={model}
        preference={preference}
        setPreference={setPreference}
        onStart={handleStartConversation}
        isPending={createConversation.isPending}
      />
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* Message count ribbon */}
      <div className="flex-none flex items-center justify-between px-4 py-1.5 border-b border-border/20 bg-card/20">
        <div className="flex items-center gap-1.5">
          <Activity className={`w-3 h-3 ${meta.accent}`} />
          <span className="text-[10px] text-muted-foreground font-medium">{msgCount} messages</span>
        </div>
        {isCompleted && (
          <span className="text-[10px] text-emerald-400 font-semibold">● Session complete</span>
        )}
        {!isCompleted && msgCount > 0 && (
          <span className={`text-[10px] ${meta.accent} font-semibold animate-pulse`}>● Live</span>
        )}
      </div>

      {/* Messages — independently scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth">
        <div className="p-4 space-y-5">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${meta.bar} flex items-center justify-center text-[10px] mr-2 mt-1 flex-none shadow-md`}>
                  <span>{meta.icon}</span>
                </div>
              )}
              <div className="max-w-[82%] space-y-1.5">
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === "user"
                    ? "bg-accent text-accent-foreground rounded-br-sm font-medium"
                    : `${meta.msgBg} text-foreground rounded-bl-sm`
                }`}>
                  {msg.content}
                </div>
                {msg.role === "assistant" && (msg.technique || msg.phase || msg.isConversion) && (
                  <div className="flex items-center gap-1.5 flex-wrap pl-1">
                    <TechniqueBadge technique={msg.technique ?? ""} />
                    <PhaseBadge phase={msg.phase ?? ""} />
                    {msg.isConversion && (
                      <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold uppercase tracking-wide">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                        conversion
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && <TypingDots model={model} />}

          {/* Completion state */}
          {isCompleted && (
            <div className={`mx-2 p-4 rounded-xl border ${meta.msgBg} text-center`}>
              <div className={`text-2xl mb-1`}>🏁</div>
              <p className={`text-xs font-semibold ${meta.accent}`}>Session Completed</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Results recorded to analytics</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Conversion decision — appears after 4 messages */}
      {!isCompleted && messages.length > 4 && (
        <div className="flex-none px-4 py-3 border-t border-border/30 bg-card/30 backdrop-blur-sm">
          <p className="text-[10px] text-muted-foreground mb-2 text-center font-medium uppercase tracking-widest">
            Did the AI change your mind?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleComplete(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-semibold border border-emerald-500/30 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/15 transition-all"
            >
              <CheckCircle2 className="w-3 h-3" /> Yes, switched
            </button>
            <button
              onClick={() => handleComplete(false)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-semibold border border-red-500/30 text-red-400 bg-red-500/5 hover:bg-red-500/15 transition-all"
            >
              <XCircle className="w-3 h-3" /> No change
            </button>
          </div>
        </div>
      )}

      {/* Input — always pinned to bottom */}
      {!isCompleted && (
        <div className="flex-none p-3 border-t border-border/30 bg-card/20 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your response…"
              className={`flex-1 px-4 py-2.5 rounded-xl bg-card/60 border border-border/50 text-foreground placeholder:text-muted-foreground/40 text-sm focus:outline-none focus:ring-2 transition-all ${meta.ring} backdrop-blur-sm`}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-none
                bg-gradient-to-br ${meta.bar} text-white shadow-md
                hover:opacity-90 hover:scale-105 active:scale-95
                disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100
                transition-all duration-150`}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PanelHeader({ model, sessionActive }: { model: ModelType; sessionActive?: boolean }) {
  const meta = MODEL_META[model];
  return (
    <div className="flex-none">
      {/* Gradient accent bar */}
      <div className={`h-0.5 w-full bg-gradient-to-r ${meta.bar}`} />
      {/* Header content */}
      <div className="flex items-center justify-between px-5 py-3 bg-card/30 backdrop-blur-sm border-b border-border/20">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${meta.bar} flex items-center justify-center text-sm shadow-md`}>
            {meta.icon}
          </div>
          <div>
            <div className={`text-sm font-bold ${meta.accent} leading-none`}>{meta.label}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">AI Sales Consultant</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${meta.dot} ${sessionActive ? "animate-pulse" : "opacity-30"}`} />
          <span className={`text-[10px] font-medium ${sessionActive ? meta.accent : "text-muted-foreground/40"}`}>
            {sessionActive ? "Active" : "Standby"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const [, navigate] = useLocation();
  const params = useParams<{ model?: string }>();
  const [activeModel, setActiveModel] = useState<ModelType>((params.model as ModelType) || "gemini");
  const [activeSessions, setActiveSessions] = useState<Record<ModelType, boolean>>({ gemini: false, grok: false, gpt: false });
  const models: ModelType[] = useMemo(() => ["gemini", "grok", "gpt"], []);

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">

      {/* Global header */}
      <header className="flex-none border-b border-border/40 bg-background/90 backdrop-blur-xl z-50" style={{ height: "52px" }}>
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-border/50" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-accent/60 to-accent flex items-center justify-center">
                <Brain className="w-3.5 h-3.5 text-black" />
              </div>
              <span className="font-bold text-sm tracking-tight">Persuasion Lab</span>
              <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 font-semibold uppercase tracking-widest">
                Research
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://www.linkedin.com/in/sathishlella/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline text-[10px] text-muted-foreground/40 hover:text-accent/70 transition-colors duration-200"
            >
              Designed by <span className="underline underline-offset-2 decoration-transparent hover:decoration-accent/40">Sathish Lella</span>
            </a>
            <button
              onClick={() => navigate("/analytics")}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all border border-transparent hover:border-border/40"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile tabs */}
      <div className="flex-none border-b border-border/40 bg-card/40 backdrop-blur-sm lg:hidden">
        <div className="flex items-center gap-1 px-4 py-2">
          {models.map((model) => {
            const meta = MODEL_META[model];
            return (
              <button
                key={model}
                onClick={() => setActiveModel(model)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeModel === model
                    ? `bg-gradient-to-r ${meta.bar} text-white shadow-md`
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <span>{meta.icon}</span>
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop: 3 independent panels — key fix: overflow-hidden + min-h-0 */}
      <div className="hidden lg:flex flex-1 min-h-0 overflow-hidden">
        {models.map((model, idx) => (
          <div
            key={model}
            className="flex-1 flex flex-col min-h-0 overflow-hidden"
            style={{
              borderRight: idx < models.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
            }}
          >
            <PanelHeader model={model} sessionActive={activeSessions[model]} />
            {/* This wrapper is the critical scroll container */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <ChatInterface model={model} />
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: single panel */}
      <div className="lg:hidden flex-1 min-h-0 overflow-hidden flex flex-col">
        <PanelHeader model={activeModel} sessionActive={activeSessions[activeModel]} />
        <div className="flex-1 min-h-0 overflow-hidden">
          <ChatInterface model={activeModel} />
        </div>
      </div>
    </div>
  );
}
