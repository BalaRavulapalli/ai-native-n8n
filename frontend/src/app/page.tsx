import Link from "next/link";
import { SorenLogo } from "@/components/soren-logo";
import { ResetButton } from "@/components/reset-button";
import {
  Sparkles,
  FileSearch,
  Rocket,
  ShieldCheck,
  Server,
  MessageSquare,
  ArrowRight,
  ArrowDown,
  Database,
  Lock,
  Zap,
  CheckCircle2,
  Clock,
  GitBranch,
  Workflow,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 overflow-x-hidden">
      {/* ─── NAVBAR ─── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <SorenLogo className="h-7 w-7 text-zinc-100" />
            <span className="text-lg font-semibold tracking-tight">Soren</span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="#features"
              className="hidden sm:block text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="hidden sm:block text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              How It Works
            </a>
            <a
              href="#architecture"
              className="hidden sm:block text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Architecture
            </a>
            <ResetButton />
            <Link
              href="/app"
              className="rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 dot-pattern">
        {/* Gradient orbs */}
        <div
          className="absolute top-[-200px] left-[-200px] w-[700px] h-[700px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%)",
            animation: "float-slow 25s ease-in-out infinite",
          }}
        />
        <div
          className="absolute bottom-[-100px] right-[-200px] w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)",
            animation: "float-slow-reverse 20s ease-in-out infinite",
          }}
        />
        <div
          className="absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(96, 165, 250, 0.06) 0%, transparent 70%)",
            animation: "pulse-glow 8s ease-in-out infinite",
          }}
        />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 backdrop-blur px-4 py-1.5 mb-8 animate-fade-in-up">
            <Lock className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-xs font-medium text-zinc-400">
              Self-Hosted &middot; Built for Regulated Industries
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6 animate-fade-in-up animate-delay-100">
            Turn Natural Language Into{" "}
            <span className="gradient-text">Automated Workflows</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up animate-delay-200">
            Generate, deploy, and test n8n workflows grounded in your
            company&apos;s actual tools, policies, and databases. Context-aware
            automation that understands your business.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 animate-fade-in-up animate-delay-300">
            <Link
              href="/app"
              className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-8 py-3.5 text-base font-semibold text-white transition-colors shadow-lg shadow-blue-600/20"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how-it-works"
              className="flex items-center gap-2 rounded-xl border border-zinc-700 hover:border-zinc-600 bg-zinc-900/50 px-8 py-3.5 text-base font-medium text-zinc-300 hover:text-zinc-100 transition-colors"
            >
              See How It Works
              <ArrowDown className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* ─── HERO MOCKUP ─── */}
        <div className="relative z-10 mx-auto max-w-5xl w-full px-4 animate-fade-in-up animate-delay-400">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 backdrop-blur-sm shadow-2xl shadow-black/40 overflow-hidden">
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-800/80 bg-zinc-900/80">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-zinc-700/80" />
                <div className="w-3 h-3 rounded-full bg-zinc-700/80" />
                <div className="w-3 h-3 rounded-full bg-zinc-700/80" />
              </div>
              <div className="flex items-center gap-2 ml-4">
                <SorenLogo className="h-4 w-4 text-zinc-400" />
                <span className="text-xs text-zinc-500">
                  Soren Workflow Automation
                </span>
              </div>
            </div>

            <div className="flex min-h-[340px]">
              {/* Sidebar mock */}
              <div className="w-52 border-r border-zinc-800/60 p-4 hidden md:block bg-zinc-950/40">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 mb-3">
                  Company Context
                </div>
                <div className="space-y-2.5">
                  {[
                    "Salesforce CRM",
                    "PostgreSQL",
                    "Slack (5 channels)",
                    "SharePoint Docs",
                    "6 Policies Indexed",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 text-[11px] text-zinc-500"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                      {item}
                    </div>
                  ))}
                </div>

                <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 mt-6 mb-3">
                  Recents
                </div>
                <div className="space-y-1">
                  <div className="text-[11px] text-zinc-400 bg-zinc-800/60 rounded-md px-2 py-1.5 truncate">
                    Sanctions screening autom...
                  </div>
                  <div className="text-[11px] text-zinc-500 px-2 py-1.5 truncate">
                    KYC review reminder work...
                  </div>
                </div>
              </div>

              {/* Chat area mock */}
              <div className="flex-1 p-5 space-y-4 shimmer">
                {/* User message */}
                <div className="flex justify-end">
                  <div className="bg-blue-600/15 border border-blue-500/20 rounded-xl px-4 py-3 max-w-md">
                    <p className="text-[12px] text-zinc-200 leading-relaxed">
                      Set up an automation that checks for new client
                      applications every morning, runs them against our
                      sanctions list, and routes flagged ones to the compliance
                      team&apos;s Slack channel
                    </p>
                  </div>
                </div>

                {/* Generation status */}
                <div className="space-y-1.5 pl-1">
                  {[
                    { label: "Retrieving company context", done: true },
                    { label: "Queried 3 relevant policies", done: true },
                    { label: "Selected n8n nodes", done: true },
                    { label: "Generated workflow", done: true },
                  ].map((step) => (
                    <div
                      key={step.label}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle2 className="h-3 w-3 text-emerald-500/70" />
                      <span className="text-[11px] text-zinc-500">
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Workflow preview */}
                <div className="bg-zinc-800/40 border border-zinc-700/40 rounded-xl p-4">
                  <div className="text-[11px] font-medium text-zinc-400 mb-3">
                    Daily Sanctions Screening
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="shrink-0 rounded-lg px-3 py-1.5 border bg-amber-500/10 border-amber-500/20">
                        <div className="text-[11px] font-medium text-amber-400">Schedule Trigger</div>
                        <div className="text-[9px] text-zinc-500">8:00 AM</div>
                      </div>
                      <span className="text-zinc-600 text-xs">&rarr;</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="shrink-0 rounded-lg px-3 py-1.5 border bg-blue-500/10 border-blue-500/20">
                        <div className="text-[11px] font-medium text-blue-400">Query New Clients</div>
                        <div className="text-[9px] text-zinc-500">PostgreSQL</div>
                      </div>
                      <span className="text-zinc-600 text-xs">&rarr;</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="shrink-0 rounded-lg px-3 py-1.5 border bg-purple-500/10 border-purple-500/20">
                        <div className="text-[11px] font-medium text-purple-400">OFAC Screening</div>
                        <div className="text-[9px] text-zinc-500">SDN + UN Lists</div>
                      </div>
                      <span className="text-zinc-600 text-xs">&rarr;</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="shrink-0 rounded-lg px-3 py-1.5 border bg-rose-500/10 border-rose-500/20">
                        <div className="text-[11px] font-medium text-rose-400">Route Flagged</div>
                        <div className="text-[9px] text-zinc-500">IF Node</div>
                      </div>
                      <span className="text-zinc-600 text-xs">&rarr;</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="shrink-0 rounded-lg px-3 py-1.5 border bg-emerald-500/10 border-emerald-500/20">
                        <div className="text-[11px] font-medium text-emerald-400">#compliance-alerts</div>
                        <div className="text-[9px] text-zinc-500">Slack</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <div className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-blue-600/30 text-blue-300 border border-blue-500/20">
                      Deploy to n8n
                    </div>
                    <div className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                      Run Tests
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reflection/glow under mockup */}
          <div className="h-40 bg-gradient-to-b from-blue-500/5 to-transparent rounded-b-3xl -mt-1 blur-xl" />
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="relative py-32 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-1.5 mb-6">
              <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-xs font-medium text-zinc-400">
                Capabilities
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Everything you need to automate
              <br />
              <span className="gradient-text">with confidence</span>
            </h2>
            <p className="text-zinc-500 max-w-2xl mx-auto">
              Context-aware workflow generation that goes beyond simple LLM
              output. Every workflow is grounded in your company&apos;s real
              environment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Sparkles,
                title: "Context-Aware Generation",
                description:
                  "Workflows reference your actual Slack channels, database tables, policies, and team structure — not generic placeholders.",
                iconBg: "bg-blue-500/10 border-blue-500/20",
                iconColor: "text-blue-400",
              },
              {
                icon: FileSearch,
                title: "RAG-Powered Knowledge",
                description:
                  "Upload compliance manuals, procedures, and policies. The system learns your processes through document embeddings and retrieval.",
                iconBg: "bg-purple-500/10 border-purple-500/20",
                iconColor: "text-purple-400",
              },
              {
                icon: Rocket,
                title: "One-Click Deploy",
                description:
                  "Deploy generated workflows directly to your self-hosted n8n instance. Open in n8n's visual editor to customize further.",
                iconBg: "bg-emerald-500/10 border-emerald-500/20",
                iconColor: "text-emerald-400",
              },
              {
                icon: ShieldCheck,
                title: "Three-Layer Testing",
                description:
                  "Logical audit, dry-run trace, and real execution against your data. Verify correctness with actual results, not speculation.",
                iconBg: "bg-amber-500/10 border-amber-500/20",
                iconColor: "text-amber-400",
              },
              {
                icon: Server,
                title: "Fully Self-Hosted",
                description:
                  "Every component runs on your infrastructure via Docker Compose. Documents, data, and workflows never leave your environment.",
                iconBg: "bg-rose-500/10 border-rose-500/20",
                iconColor: "text-rose-400",
              },
              {
                icon: MessageSquare,
                title: "Iterative Refinement",
                description:
                  "Refine workflows through conversation. Follow-up messages modify the existing workflow intelligently — no starting from scratch.",
                iconBg: "bg-cyan-500/10 border-cyan-500/20",
                iconColor: "text-cyan-400",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="feature-card group rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 hover:bg-zinc-900/60 transition-all"
              >
                <div
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${feature.iconBg}`}
                >
                  <feature.icon
                    className={`h-5 w-5 ${feature.iconColor}`}
                  />
                </div>
                <h3 className="text-base font-semibold text-zinc-200 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="relative py-32 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-1.5 mb-6">
              <Zap className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-xs font-medium text-zinc-400">
                How It Works
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              From description to deployment
              <br />
              <span className="gradient-text">in minutes</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-4">
            {[
              {
                step: "01",
                icon: MessageSquare,
                title: "Describe",
                description:
                  "Tell the system what you want to automate in plain English. It already knows your company's tools, policies, org structure, and databases.",
                detail:
                  '"Check new clients against our sanctions list every morning and alert the compliance team on flagged ones"',
              },
              {
                step: "02",
                icon: Workflow,
                title: "Generate",
                description:
                  "The AI retrieves relevant company documents, assembles your full context, and generates a complete, deployable n8n workflow with proper node configuration.",
                detail:
                  "Schedule Trigger \u2192 Query Postgres \u2192 OFAC Screen \u2192 IF Flagged \u2192 Slack Alert",
              },
              {
                step: "03",
                icon: ShieldCheck,
                title: "Deploy & Test",
                description:
                  "Deploy to n8n with one click, then run three-layer verification: logical audit, dry-run trace, and real execution against your mock data.",
                detail:
                  "4/5 nodes passed \u00b7 2 clients flagged \u00b7 Slack alert routed to #compliance-alerts",
              },
            ].map((item) => (
              <div key={item.step}>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 h-full">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-xs font-mono text-blue-400/60 mb-0.5">
                        STEP {item.step}
                      </div>
                      <h3 className="text-lg font-semibold text-zinc-200">
                        {item.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-400 leading-relaxed mb-5">
                    {item.description}
                  </p>

                  <div className="rounded-lg bg-zinc-800/40 border border-zinc-700/30 px-4 py-3">
                    <p className="text-xs text-zinc-500 italic leading-relaxed">
                      {item.detail}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ARCHITECTURE ─── */}
      <section id="architecture" className="relative py-32 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-1.5 mb-6">
              <GitBranch className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-xs font-medium text-zinc-400">
                Architecture
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Self-hosted.{" "}
              <span className="gradient-text">Fully private.</span>
            </h2>
            <p className="text-zinc-500 max-w-2xl mx-auto">
              Five services, one command. The entire stack runs on your
              infrastructure via Docker Compose. Nothing leaves your environment.
            </p>
          </div>

          {/* Architecture diagram */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-8 sm:p-12 mb-12">
            {/* Top row: main pipeline */}
            <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-6 mb-12">
              {[
                {
                  name: "Next.js",
                  sub: "Frontend UI",
                  port: "3000",
                  icon: "layout",
                },
                {
                  name: "FastAPI",
                  sub: "Backend API",
                  port: "8000",
                  icon: "api",
                },
                {
                  name: "Claude AI",
                  sub: "LLM Engine",
                  port: "",
                  icon: "brain",
                },
                {
                  name: "n8n",
                  sub: "Workflow Engine",
                  port: "5678",
                  icon: "workflow",
                },
              ].map((svc, i, arr) => (
                <div key={svc.name} className="flex items-center gap-4 lg:gap-6">
                  <div className="w-40 rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4 text-center">
                    <div className="text-sm font-semibold text-zinc-200">
                      {svc.name}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">
                      {svc.sub}
                    </div>
                    {svc.port && (
                      <div className="text-[10px] font-mono text-zinc-600 mt-1">
                        :{svc.port}
                      </div>
                    )}
                  </div>
                  {i < arr.length - 1 && (
                    <div className="text-zinc-600 text-lg hidden lg:block">
                      &rarr;
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom row: data stores */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
              <div className="text-xs text-zinc-600 uppercase tracking-widest hidden sm:block">
                Data Layer
              </div>
              <div className="flex items-center gap-4">
                {[
                  { name: "PostgreSQL", sub: "Company Data", port: "5432" },
                  {
                    name: "Qdrant",
                    sub: "Vector Store",
                    port: "6333",
                  },
                ].map((store) => (
                  <div
                    key={store.name}
                    className="w-36 rounded-xl border border-zinc-700/30 bg-zinc-800/30 p-3 text-center"
                  >
                    <Database className="h-4 w-4 text-zinc-500 mx-auto mb-1" />
                    <div className="text-xs font-semibold text-zinc-300">
                      {store.name}
                    </div>
                    <div className="text-[10px] text-zinc-500">{store.sub}</div>
                    <div className="text-[9px] font-mono text-zinc-600 mt-0.5">
                      :{store.port}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Key points */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: Lock,
                title: "Zero Data Leakage",
                description:
                  "Documents and queries stay within your infrastructure. LLM calls use your own API keys.",
              },
              {
                icon: Clock,
                title: "One-Command Setup",
                description:
                  "docker compose up starts all five services with pre-configured networking and health checks.",
              },
              {
                icon: Zap,
                title: "Production-Ready",
                description:
                  "Decoupled microservices architecture. Each service is independently deployable and scalable.",
              },
            ].map((point) => (
              <div
                key={point.title}
                className="flex items-start gap-3 rounded-xl border border-zinc-800/50 bg-zinc-900/20 p-5"
              >
                <point.icon className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-zinc-300 mb-1">
                    {point.title}
                  </h4>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {point.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative py-32 px-6">
        <div className="mx-auto max-w-3xl text-center">
          {/* Gradient glow behind CTA */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(59, 130, 246, 0.06) 0%, transparent 60%)",
            }}
          />

          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Ready to{" "}
              <span className="gradient-text">automate your workflows?</span>
            </h2>
            <p className="text-zinc-500 mb-10 max-w-xl mx-auto">
              Set up your company profile, upload your internal documents, and
              start generating context-aware workflow automations in minutes.
            </p>
            <Link
              href="/app"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-10 py-4 text-base font-semibold text-white transition-colors shadow-lg shadow-blue-600/20"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-zinc-800/50 py-8 px-6">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <SorenLogo className="h-5 w-5 text-zinc-400" />
            <span className="text-sm text-zinc-500">
              Soren Workflow Automation
            </span>
          </div>
          <p className="text-xs text-zinc-600">
            Built for regulated industries. Self-hosted and private by design.
          </p>
        </div>
      </footer>
    </div>
  );
}
