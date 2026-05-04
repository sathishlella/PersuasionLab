import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { ArrowLeft, MessageSquare, TrendingUp, Target, BarChart3, Activity, Eye, Loader2 } from "lucide-react";

function MetricCard({ label, value, subtitle, icon: Icon }: { label: string; value: string | number; subtitle?: string; icon: any }) {
  return (
    <div className="p-5 rounded-xl border border-border/50 bg-card">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-accent" />
        </div>
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}

function ModelComparisonCard({ data }: { data: any }) {
  const modelColors: Record<string, string> = {
    gpt: "border-emerald-500/30",
    grok: "border-blue-500/30",
    gemini: "border-purple-500/30",
  };
  const modelBg: Record<string, string> = {
    gpt: "bg-emerald-500/5",
    grok: "bg-blue-500/5",
    gemini: "bg-purple-500/5",
  };
  const modelAccent: Record<string, string> = {
    gpt: "text-emerald-400",
    grok: "text-blue-400",
    gemini: "text-purple-400",
  };

  return (
    <div className={`p-6 rounded-xl border ${modelColors[data.model]} ${modelBg[data.model]}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-bold ${modelAccent[data.model]}`}>
          {data.model.charAt(0).toUpperCase() + data.model.slice(1)}
        </h3>
        <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">
          {data.totalSessions} sessions
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">Success Rate</span>
            <span className="font-semibold">{data.successRate.toFixed(1)}%</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                data.model === "gpt" ? "bg-emerald-500" : data.model === "grok" ? "bg-blue-500" : "bg-purple-500"
              }`}
              style={{ width: `${Math.min(data.successRate, 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground">Conversions</p>
            <p className="text-lg font-bold">{data.successfulConversions}</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground">Avg Messages</p>
            <p className="text-lg font-bold">{data.avgMessagesToConversion || "—"}</p>
          </div>
        </div>

        {Object.keys(data.techniqueBreakdown).length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Top Techniques</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(data.techniqueBreakdown)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .slice(0, 4)
                .map(([tech, count]) => (
                  <span key={tech} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                    {tech.replace(/_/g, " ")} ({count as number})
                  </span>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TechniqueChart({ comparison }: { comparison: any[] | undefined }) {
  const techniques = [
    "reciprocity", "commitment", "social_proof", "authority",
    "liking", "scarcity", "unity", "reframing", "anchoring", "loss_aversion"
  ];

  // Aggregate technique counts from all models
  const techData = techniques.map(tech => {
    let gpt = 0, grok = 0, gemini = 0;
    if (comparison) {
      comparison.forEach(m => {
        const count = m.techniqueBreakdown[tech] || 0;
        if (m.model === "gpt") gpt = count;
        if (m.model === "grok") grok = count;
        if (m.model === "gemini") gemini = count;
      });
    }
    return { name: tech, gpt, grok, gemini, total: gpt + grok + gemini };
  }).filter(t => t.total > 0);

  if (techData.length === 0) {
    return (
      <div className="p-8 rounded-xl border border-border/50 bg-card text-center">
        <p className="text-muted-foreground">No technique data yet. Start conversations to see frequency analysis.</p>
      </div>
    );
  }

  const maxTotal = Math.max(...techData.map(t => t.total));

  return (
    <div className="p-6 rounded-xl border border-border/50 bg-card">
      <div className="space-y-4">
        {techData.sort((a, b) => b.total - a.total).map(tech => (
          <div key={tech.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium capitalize">{tech.name.replace(/_/g, " ")}</span>
              <span className="text-xs text-muted-foreground">{tech.total} uses</span>
            </div>
            <div className="flex gap-0.5 h-6 rounded-md overflow-hidden bg-secondary">
              {tech.gpt > 0 && (
                <div className="bg-emerald-500 h-full transition-all" style={{ width: `${(tech.gpt / maxTotal) * 100}%` }} title={`GPT: ${tech.gpt}`} />
              )}
              {tech.grok > 0 && (
                <div className="bg-blue-500 h-full transition-all" style={{ width: `${(tech.grok / maxTotal) * 100}%` }} title={`Grok: ${tech.grok}`} />
              )}
              {tech.gemini > 0 && (
                <div className="bg-purple-500 h-full transition-all" style={{ width: `${(tech.gemini / maxTotal) * 100}%` }} title={`Gemini: ${tech.gemini}`} />
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/30">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-500" /><span className="text-xs text-muted-foreground">GPT</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-blue-500" /><span className="text-xs text-muted-foreground">Grok</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-purple-500" /><span className="text-xs text-muted-foreground">Gemini</span></div>
      </div>
    </div>
  );
}

function ConversationReplay({ conversationId, onClose }: { conversationId: number; onClose: () => void }) {
  const { data } = trpc.conversation.get.useQuery({ conversationId });

  if (!data) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-card rounded-xl p-8 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-accent" />
          <p className="text-sm text-muted-foreground mt-2">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm">Conversation Replay</h3>
            <p className="text-xs text-muted-foreground">
              {data.conversation.modelType.toUpperCase()} • {data.conversation.userInitialPreference}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg">×</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {data.messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[85%]">
                <div className={`px-3 py-2 rounded-xl text-sm ${
                  msg.role === "user"
                    ? "bg-accent text-accent-foreground rounded-br-sm"
                    : "bg-secondary text-secondary-foreground rounded-bl-sm"
                }`}>
                  {msg.content}
                </div>
                {msg.role === "assistant" && msg.persuasionTechnique && msg.persuasionTechnique !== "none" && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                      {msg.persuasionTechnique.replace(/_/g, " ")}
                    </span>
                    {msg.isConversionEvent && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        conversion
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-border/50 text-center">
          <span className={`text-xs px-3 py-1 rounded-full ${
            data.conversation.persuasionSuccess
              ? "bg-emerald-500/10 text-emerald-400"
              : data.conversation.status === "completed" ? "bg-red-500/10 text-red-400" : "bg-yellow-500/10 text-yellow-400"
          }`}>
            {data.conversation.persuasionSuccess ? "Successfully Converted" : data.conversation.status === "completed" ? "No Conversion" : "In Progress"}
          </span>
        </div>
      </div>
    </div>
  );
}

function SessionHistory() {
  const { data: conversations } = trpc.conversation.list.useQuery();
  const [replayId, setReplayId] = useState<number | null>(null);

  if (!conversations || conversations.length === 0) {
    return (
      <div className="p-8 rounded-xl border border-border/50 bg-card text-center">
        <p className="text-muted-foreground">No sessions yet. Start a conversation to see history.</p>
      </div>
    );
  }

  return (
    <>
      {replayId && <ConversationReplay conversationId={replayId} onClose={() => setReplayId(null)} />}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <div className="divide-y divide-border/30">
          {conversations.slice(0, 10).map((conv) => (
            <div key={conv.id} className="p-4 flex items-center justify-between cursor-pointer hover:bg-secondary/30 transition-colors" onClick={() => setReplayId(conv.id)}>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  conv.modelType === "gpt" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                  conv.modelType === "grok" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                  "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                }`}>
                  {conv.modelType}
                </span>
                <div>
                  <p className="text-sm font-medium">{conv.userInitialPreference || "Unknown preference"}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(conv.createdAt).toLocaleDateString()} • {conv.status}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {conv.status === "completed" && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    conv.persuasionSuccess
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-red-500/10 text-red-400"
                  }`}>
                    {conv.persuasionSuccess ? "Converted" : "No change"}
                  </span>
                )}
                {conv.status === "active" && (
                  <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400">Active</span>
                )}
                <Eye className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function DeepResearchSection() {
  const { data: patterns, isLoading, error } = trpc.analytics.behavioralPatterns.useQuery();

  if (isLoading) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-1">Deep Research: Behavioral Patterns</h2>
        <p className="text-sm text-muted-foreground mb-6">Cross-model strategy comparison and insight-rich analysis</p>
        <div className="p-8 rounded-xl border border-border/50 bg-card text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-accent" />
          <p className="text-muted-foreground mt-2">Analyzing behavioral patterns...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-1">Deep Research: Behavioral Patterns</h2>
        <p className="text-sm text-muted-foreground mb-6">Cross-model strategy comparison and insight-rich analysis</p>
        <div className="p-8 rounded-xl border border-red-500/30 bg-red-500/5 text-center">
          <p className="text-red-400 text-sm">Failed to load behavioral patterns. Please try again.</p>
        </div>
      </div>
    );
  }

  if (!patterns || patterns.every(p => p.avgEngagement === 0)) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-1">Deep Research: Behavioral Patterns</h2>
        <p className="text-sm text-muted-foreground mb-6">Cross-model strategy comparison and insight-rich analysis</p>
        <div className="p-8 rounded-xl border border-border/50 bg-card text-center">
          <p className="text-muted-foreground">Insufficient data. Complete more sessions to unlock behavioral insights.</p>
        </div>
      </div>
    );
  }

  const modelColors: Record<string, string> = { gpt: "emerald", grok: "blue", gemini: "purple" };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-1">Deep Research: Behavioral Patterns</h2>
      <p className="text-sm text-muted-foreground mb-6">Cross-model strategy comparison and insight-rich analysis</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {patterns.map(p => (
          <div key={p.model} className={`p-5 rounded-xl border border-${modelColors[p.model]}-500/30 bg-${modelColors[p.model]}-500/5`}>
            <h4 className={`font-bold text-${modelColors[p.model]}-400 mb-3 capitalize`}>{p.model}</h4>
            
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground mb-1">Conversion Speed</p>
                <p className="text-lg font-bold">{p.conversionSpeed.avg || "—"} <span className="text-xs font-normal text-muted-foreground">avg msgs</span></p>
                {p.conversionSpeed.fastest > 0 && (
                  <p className="text-[10px] text-muted-foreground">Fastest: {p.conversionSpeed.fastest} | Slowest: {p.conversionSpeed.slowest}</p>
                )}
              </div>

              <div className="p-3 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground mb-1">Avg Engagement Depth</p>
                <p className="text-lg font-bold">{p.avgEngagement} <span className="text-xs font-normal text-muted-foreground">msgs/session</span></p>
              </div>

              {p.winningTechniques.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Winning Techniques</p>
                  <div className="flex flex-wrap gap-1">
                    {p.winningTechniques.map(([tech, count]) => (
                      <span key={tech} className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {tech.replace(/_/g, " ")} ({count})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {p.losingTechniques.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Ineffective Techniques</p>
                  <div className="flex flex-wrap gap-1">
                    {p.losingTechniques.map(([tech, count]) => (
                      <span key={tech} className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                        {tech.replace(/_/g, " ")} ({count})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TechniqueSequencingSection() {
  const { data: sequencing, isLoading, error } = trpc.analytics.techniqueSequencing.useQuery();

  if (isLoading) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-1">Technique Sequencing</h2>
        <p className="text-sm text-muted-foreground mb-6">Persuasion technique transition patterns across conversations</p>
        <div className="p-8 rounded-xl border border-border/50 bg-card text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-accent" />
          <p className="text-muted-foreground mt-2">Computing technique transitions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-1">Technique Sequencing</h2>
        <p className="text-sm text-muted-foreground mb-6">Persuasion technique transition patterns across conversations</p>
        <div className="p-8 rounded-xl border border-red-500/30 bg-red-500/5 text-center">
          <p className="text-red-400 text-sm">Failed to load sequencing data. Please try again.</p>
        </div>
      </div>
    );
  }

  if (!sequencing || sequencing.every(s => s.totalTransitions === 0)) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-1">Technique Sequencing</h2>
        <p className="text-sm text-muted-foreground mb-6">Persuasion technique transition patterns across conversations</p>
        <div className="p-8 rounded-xl border border-border/50 bg-card text-center">
          <p className="text-muted-foreground">Insufficient data. More multi-message conversations needed for sequencing analysis.</p>
        </div>
      </div>
    );
  }

  const modelColors: Record<string, string> = { gpt: "emerald", grok: "blue", gemini: "purple" };
  const phases = ["rapport", "discovery", "seed_doubt", "reframe", "close"];

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-1">Technique Sequencing</h2>
      <p className="text-sm text-muted-foreground mb-6">Persuasion technique transition patterns across conversations</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sequencing.map(s => (
          <div key={s.model} className={`p-5 rounded-xl border border-${modelColors[s.model]}-500/30 bg-${modelColors[s.model]}-500/5`}>
            <h4 className={`font-bold text-${modelColors[s.model]}-400 mb-3 capitalize`}>{s.model}</h4>
            
            {s.topTransitions.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">Top Technique Transitions</p>
                <div className="space-y-1.5">
                  {s.topTransitions.slice(0, 5).map((t, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-foreground/80 truncate flex-1">{t.transition}</span>
                      <span className="text-muted-foreground ml-2">{t.count}x</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs text-muted-foreground mb-2">Avg Phase Position (message #)</p>
              <div className="space-y-1">
                {phases.map(phase => (
                  <div key={phase} className="flex items-center justify-between text-xs">
                    <span className="capitalize text-foreground/80">{phase.replace(/_/g, " ")}</span>
                    <span className="text-muted-foreground">{s.avgPhasePosition[phase] || "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Analytics() {
  const [, navigate] = useLocation();

  const { data: overview } = trpc.analytics.overview.useQuery();
  const { data: comparison } = trpc.analytics.modelComparison.useQuery();

  const totalSessions = overview
    ? overview.gpt.totalConversations + overview.grok.totalConversations + overview.gemini.totalConversations
    : 0;
  const totalSuccess = overview
    ? overview.gpt.successfulConversations + overview.grok.successfulConversations + overview.gemini.successfulConversations
    : 0;
  const overallRate = totalSessions > 0 ? ((totalSuccess / totalSessions) * 100).toFixed(1) : "0";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-accent" />
              <span className="font-semibold text-sm">Research Analytics</span>
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
            <Button size="sm" onClick={() => navigate("/chat")} className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs">
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> New Session
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8 max-w-6xl mx-auto">
        {/* Overview Metrics */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-1">Overview</h2>
          <p className="text-sm text-muted-foreground mb-6">Aggregate research metrics across all models</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Total Sessions" value={totalSessions} icon={MessageSquare} />
            <MetricCard label="Conversions" value={totalSuccess} icon={Target} />
            <MetricCard label="Success Rate" value={`${overallRate}%`} icon={TrendingUp} />
            <MetricCard label="Models Active" value="3" subtitle="GPT, Grok, Gemini" icon={Activity} />
          </div>
        </div>

        {/* Model Comparison */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-1">Model Comparison</h2>
          <p className="text-sm text-muted-foreground mb-6">Side-by-side persuasion effectiveness analysis</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {comparison?.map((data) => (
              <ModelComparisonCard key={data.model} data={data} />
            )) || (
              <>
                <ModelComparisonCard data={{ model: "gpt", totalSessions: 0, completedSessions: 0, successfulConversions: 0, successRate: 0, avgMessagesToConversion: 0, techniqueBreakdown: {}, totalMessages: 0 }} />
                <ModelComparisonCard data={{ model: "grok", totalSessions: 0, completedSessions: 0, successfulConversions: 0, successRate: 0, avgMessagesToConversion: 0, techniqueBreakdown: {}, totalMessages: 0 }} />
                <ModelComparisonCard data={{ model: "gemini", totalSessions: 0, completedSessions: 0, successfulConversions: 0, successRate: 0, avgMessagesToConversion: 0, techniqueBreakdown: {}, totalMessages: 0 }} />
              </>
            )}
          </div>
        </div>

        {/* Technique Frequency Chart */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-1">Technique Frequency</h2>
          <p className="text-sm text-muted-foreground mb-6">Distribution of persuasion techniques across all conversations</p>
          <TechniqueChart comparison={comparison} />
        </div>

        {/* Session History */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-1">Recent Sessions</h2>
          <p className="text-sm text-muted-foreground mb-6">Latest conversation sessions with outcomes</p>
          <SessionHistory />
        </div>

        {/* Deep Research: Behavioral Patterns */}
        <DeepResearchSection />

        {/* Technique Sequencing */}
        <TechniqueSequencingSection />

        {/* Research Notes */}
        <div className="p-6 rounded-xl border border-border/50 bg-card">
          <h3 className="text-lg font-semibold mb-3">Research Framework</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-muted-foreground">
            <div>
              <h4 className="font-medium text-foreground mb-2">Persuasion Principles (Cialdini)</h4>
              <ul className="space-y-1">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-accent" /> Reciprocity</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-accent" /> Commitment & Consistency</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-accent" /> Social Proof</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-accent" /> Authority</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-accent" /> Liking</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-accent" /> Scarcity</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-accent" /> Unity</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Conversation Phases</h4>
              <ul className="space-y-1">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-accent" /> Phase 1: Rapport Building</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-accent" /> Phase 2: Discovery</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-accent" /> Phase 3: Seed Doubt</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-accent" /> Phase 4: Reframe</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-accent" /> Phase 5: Close</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
