import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Network,
  Radar,
  Route,
  ShieldCheck,
} from "lucide-react";
import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { Button } from "../client/components/ui/button";
import Footer from "./components/Footer";
import { footerNavigation } from "./contentSections";

const exceptionRows = [
  {
    id: "SHP-8924-X",
    customer: "Auto Parts",
    lane: "SHA -> LAX",
    risk: "6hr Port Delay",
    value: "$250k",
    level: "critical",
  },
  {
    id: "SHP-9102-Y",
    customer: "Semiconductors",
    lane: "TPE -> SFO",
    risk: "Reroute Advised",
    value: "$1.8M",
    level: "high",
  },
  {
    id: "SHP-7731-M",
    customer: "Medical Eq.",
    lane: "FRA -> JFK",
    risk: "Temp Deviation",
    value: "$850k",
    level: "high",
  },
];

const proofCards = [
  {
    icon: AlertTriangle,
    title: "Alert fatigue",
    text: "Thousands of raw shipment and disruption signals surface without business context.",
  },
  {
    icon: Network,
    title: "Siloed workflows",
    text: "Planners jump between tracking portals, spreadsheets, TMS screens, and email threads.",
  },
  {
    icon: Clock3,
    title: "Reactive responses",
    text: "By the time a manual decision is approved, the recovery window is already shrinking.",
  },
];

const workflowSteps = [
  "Import active shipments",
  "Create disruption signals",
  "Rank exceptions",
  "Compare scenarios",
  "Approve response",
  "Track pilot value",
];

export default function LandingPage() {
  return (
    <div className="bg-background text-foreground">
      <main className="rmr-grid-bg isolate overflow-hidden">
        <HeroSection />
        <ProblemSection />
        <WorkflowSection />
        <ProductProofSection />
        <FinalCta />
      </main>
      <Footer footerNavigation={footerNavigation} />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden border-b border-border/30 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_30%,rgba(76,215,246,0.16),transparent_36%),radial-gradient(circle_at_16%_72%,rgba(161,207,207,0.09),transparent_30%)]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="min-w-0">
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-[4rem] lg:leading-[1.02]">
            Rank shipment risk, compare recovery options.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            Approve response actions before delays hit customers. High-stakes
            logistics operations need a precise decision workbench, not another
            fragmented alert feed.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button className="rmr-label h-12 rounded bg-secondary px-6 text-secondary-foreground hover:bg-secondary-muted" asChild>
              <WaspRouterLink to={routes.RMRoadsPilotRoute.to}>
                Book a disruption audit
              </WaspRouterLink>
            </Button>
            <Button className="rmr-label h-12 rounded border-border/70 px-6" variant="outline" asChild>
              <WaspRouterLink to={routes.RMRoadsDashboardRoute.to}>
                See the workflow <ArrowRight className="ml-2 size-4" />
              </WaspRouterLink>
            </Button>
          </div>
        </div>

        <div className="rmr-panel relative min-h-[32rem] overflow-hidden bg-card-subtle/80 p-4">
          <RouteMap />
          <div className="absolute left-4 top-4 rounded border border-destructive/40 bg-background/90 p-3 backdrop-blur">
            <div className="rmr-label flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-4" /> Node delay: port 4A
            </div>
            <div className="rmr-data mt-1 text-muted-foreground">ETA impact: +14hrs</div>
          </div>
          <div className="absolute bottom-4 right-4 min-w-64 rounded border border-border/50 bg-background/90 p-3 backdrop-blur">
            <div className="mb-2 flex items-center justify-between border-b border-border/30 pb-2">
              <span className="rmr-label">Route Opti</span>
              <span className="rmr-data text-secondary">ACTIVE</span>
            </div>
            <div className="rmr-data grid gap-1 text-muted-foreground">
              <span>&gt; Analyzing 4,120 nodes</span>
              <span>&gt; Reroute scenario ready</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RouteMap() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#03111f]">
      <div className="absolute inset-0 rmr-grid-bg opacity-70" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 900 560" role="img" aria-label="Logistics route network">
        <defs>
          <linearGradient id="route-gradient" x1="0" x2="1" y1="0" y2="0">
            <stop stopColor="#4cd7f6" stopOpacity="0.05" />
            <stop offset="0.5" stopColor="#4cd7f6" stopOpacity="0.9" />
            <stop offset="1" stopColor="#a1cfcf" stopOpacity="0.12" />
          </linearGradient>
        </defs>
        <path d="M80 405 C220 260 330 210 476 290 S720 270 830 115" fill="none" stroke="url(#route-gradient)" strokeWidth="2" />
        <path d="M118 120 C236 184 322 150 455 230 S678 352 818 304" fill="none" stroke="#a1cfcf" strokeOpacity="0.28" strokeWidth="1.5" />
        <path d="M162 480 C290 420 385 430 512 350 S690 170 786 176" fill="none" stroke="#4cd7f6" strokeOpacity="0.25" strokeWidth="1.5" />
        {[
          [80, 405, "SHA"],
          [476, 290, "HUB"],
          [830, 115, "LAX"],
          [118, 120, "TPE"],
          [818, 304, "SFO"],
          [162, 480, "FRA"],
          [786, 176, "JFK"],
        ].map(([x, y, label]) => (
          <g key={label as string}>
            <circle cx={x as number} cy={y as number} r="5" fill="#4cd7f6" />
            <text x={(x as number) + 10} y={(y as number) - 8} fill="#d4e4fa" fontSize="11" fontFamily="Geist">{label}</text>
          </g>
        ))}
        <circle className="animate-pulse" cx="830" cy="115" r="13" fill="#ffb4ab" fillOpacity="0.14" stroke="#ffb4ab" />
      </svg>
    </div>
  );
}

function ProblemSection() {
  return (
    <section id="features" className="border-b border-border/30 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
            Fragmented alerts vs manual decisions.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            RMRoads AI turns disruption noise into a planner-ready sequence:
            ranked exceptions, explained risk, and approved response actions.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {proofCards.map((card) => (
            <div className="rmr-panel min-w-0 p-6 transition-colors hover:border-border" key={card.title}>
              <div className="mb-5 flex size-10 items-center justify-center rounded border border-secondary/30 bg-secondary/10 text-secondary">
                <card.icon className="size-5" />
              </div>
              <h3 className="text-lg font-semibold">{card.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{card.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkflowSection() {
  return (
    <section className="border-b border-border/30 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center">
          <div>
            <h2 className="text-2xl font-semibold sm:text-3xl">From import to approved response.</h2>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Keep the pilot workflow narrow: prove that the exception queue
              finds useful decisions before adding integrations or autonomous execution.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {workflowSteps.map((step, index) => (
              <div className="rmr-stream rounded border border-border/40 bg-card-subtle/70 p-4" key={step}>
                <div className="rmr-data text-secondary">0{index + 1}</div>
                <div className="mt-2 text-sm font-semibold">{step}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductProofSection() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
        <div className="rmr-panel overflow-hidden">
          <div className="border-b border-border/30 bg-background/60 px-4 py-3">
            <div className="rmr-label flex items-center gap-2 text-secondary">
              <Radar className="size-4" /> Exception queue
            </div>
          </div>
          <div className="grid grid-cols-12 gap-2 border-b border-border/30 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.05em] text-muted-foreground">
            <div className="col-span-3">Shipment</div>
            <div className="col-span-3">Lane</div>
            <div className="col-span-3">Risk</div>
            <div className="col-span-2 text-right">Value</div>
            <div className="col-span-1 text-right">State</div>
          </div>
          <div className="grid gap-2 p-3">
            {exceptionRows.map((row) => (
              <div
                className={
                  row.level === "critical"
                    ? "grid grid-cols-12 gap-2 rounded border border-destructive/50 bg-destructive/10 px-3 py-4 rmr-glow"
                    : "grid grid-cols-12 gap-2 rounded border border-border/30 bg-background/60 px-3 py-4"
                }
                key={row.id}
              >
                <div className="col-span-3 min-w-0">
                  <div className="truncate text-sm font-semibold">{row.customer}</div>
                  <div className="rmr-data truncate text-muted-foreground">{row.id}</div>
                </div>
                <div className="rmr-data col-span-3 text-muted-foreground">{row.lane}</div>
                <div className="col-span-3 text-sm">{row.risk}</div>
                <div className="rmr-data col-span-2 text-right">{row.value}</div>
                <div className="col-span-1 text-right">
                  <span className={row.level === "critical" ? "text-destructive" : "text-secondary"}>
                    {row.level === "critical" ? "CRIT" : "HIGH"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rmr-panel p-5">
            <div className="rmr-label mb-3 flex items-center gap-2 text-secondary">
              <Route className="size-4" /> Recommended scenario
            </div>
            <h3 className="text-xl font-semibold">Reroute via LGB</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Divert to the Long Beach terminal. Requires immediate carrier
              approval and avoids a projected line-stoppage penalty.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <MiniMetric label="Cost" value="+$1.5k" />
              <MiniMetric label="Time Saved" value="1 day" />
            </div>
          </div>
          <div className="rmr-panel p-5">
            <div className="rmr-label mb-3 flex items-center gap-2 text-secondary">
              <ShieldCheck className="size-4" /> Trust and control
            </div>
            <div className="grid gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-secondary" /> Human approval required.</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-secondary" /> Risk explanations shown.</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-secondary" /> Decisions stored for audit.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border/40 bg-background/60 p-3">
      <div className="rmr-label text-muted-foreground">{label}</div>
      <div className="rmr-data mt-1 text-foreground">{value}</div>
    </div>
  );
}

function FinalCta() {
  return (
    <section className="border-t border-border/30 bg-card-subtle/40 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <ShieldCheck className="mb-5 size-12 text-secondary" />
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Secure your operations.
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
          Run a 30-45 day disruption audit on your hardest lanes and quantify
          the financial impact of missed recovery windows.
        </p>
        <Button className="rmr-label mt-8 h-12 rounded bg-secondary px-6 text-secondary-foreground hover:bg-secondary-muted" asChild>
          <WaspRouterLink to={routes.RMRoadsPilotRoute.to}>
            Start 30-Day Disruption Audit
          </WaspRouterLink>
        </Button>
      </div>
    </section>
  );
}
