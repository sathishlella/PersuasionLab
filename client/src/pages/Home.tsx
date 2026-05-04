import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Brain, BarChart3, MessageSquare, Sparkles, ArrowRight, Zap } from "lucide-react";

export default function Home() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
              <Brain className="w-4 h-4 text-accent-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">PersuasionLab</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/analytics")}>
              Analytics
            </Button>
            <Button size="sm" onClick={() => navigate("/chat")} className="bg-accent text-accent-foreground hover:bg-accent/90">
              Start Session
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-secondary/50 mb-8">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-medium tracking-wide uppercase text-muted-foreground">Academic Research Platform</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            AI Persuasion
            <br />
            <span className="text-accent">Intelligence Lab</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Compare GPT, Grok, and Gemini in real-time persuasion scenarios. 
            Measure psychological influence, track technique effectiveness, and generate 
            research-grade analytics for behavioral studies.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={() => navigate("/chat")} className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 h-12 text-base">
              Launch Experiment <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/analytics")} className="px-8 h-12 text-base">
              View Analytics
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 border-t border-border/50">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl border border-border/50 bg-card hover:border-accent/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-5">
                <MessageSquare className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Three AI Models</h3>
              <p className="text-muted-foreground leading-relaxed">
                GPT, Grok, and Gemini compete as elite sales consultants, each using distinct 
                persuasion strategies powered by Cialdini's principles.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-border/50 bg-card hover:border-accent/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-5">
                <Brain className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Technique Tracking</h3>
              <p className="text-muted-foreground leading-relaxed">
                Every message is analyzed for persuasion techniques in real-time — reciprocity, 
                social proof, authority, scarcity, and more.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-border/50 bg-card hover:border-accent/30 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-5">
                <BarChart3 className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Research Analytics</h3>
              <p className="text-muted-foreground leading-relaxed">
                Side-by-side model comparison with success rates, conversion metrics, 
                technique frequency, and behavioral pattern analysis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 border-t border-border/50">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground mb-12 text-lg">Five-phase persuasion framework based on behavioral psychology research</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { phase: "1", label: "Rapport", desc: "Build trust" },
              { phase: "2", label: "Discovery", desc: "Find needs" },
              { phase: "3", label: "Seed Doubt", desc: "Subtle shift" },
              { phase: "4", label: "Reframe", desc: "New perspective" },
              { phase: "5", label: "Close", desc: "Confirm change" },
            ].map((item) => (
              <div key={item.phase} className="flex flex-col items-center p-4 rounded-xl border border-border/30 bg-card/50">
                <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold mb-2">
                  {item.phase}
                </div>
                <span className="font-semibold text-sm">{item.label}</span>
                <span className="text-xs text-muted-foreground mt-1">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Models Section */}
      <section className="py-20 border-t border-border/50">
        <div className="container max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Competing Models</h2>
            <p className="text-muted-foreground text-lg">Each model brings unique persuasion capabilities</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "GPT", badge: "OpenAI", desc: "Nuanced emotional intelligence with sophisticated language patterns" },
              { name: "Grok", badge: "xAI", desc: "Direct and witty approach with unconventional persuasion angles" },
              { name: "Gemini", badge: "Google", desc: "Data-driven reasoning with comprehensive knowledge integration" },
            ].map((model) => (
              <div key={model.name} className="relative p-6 rounded-2xl border border-border/50 bg-card overflow-hidden group hover:border-accent/40 transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-accent/10 transition-all" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-5 h-5 text-accent" />
                    <span className="font-bold text-lg">{model.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{model.badge}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{model.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="container text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            AI Physical Store Salesman Simulator — In-Store Persuasion & Behavioral Research Platform
          </p>
          <p className="text-xs text-muted-foreground/50">
            Designed by{" "}
            <a
              href="https://www.linkedin.com/in/sathishlella/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent/60 hover:text-accent transition-colors duration-200 underline underline-offset-2 decoration-accent/20 hover:decoration-accent/60"
            >
              Sathish Lella
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
