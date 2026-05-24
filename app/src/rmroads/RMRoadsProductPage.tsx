import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileSpreadsheet,
  History,
  Network,
  Radar,
  Route,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { Button } from "../client/components/ui/button";
import Footer from "../landing-page/components/Footer";
import { footerNavigation } from "../landing-page/contentSections";

const workflow = [
  {
    icon: FileSpreadsheet,
    title: "Import active shipments",
    text: "Start with a CSV from the team’s current process. No carrier or ERP integration is required for the first pilot.",
  },
  {
    icon: Radar,
    title: "Detect disruption exposure",
    text: "Match shipments against manual disruption signals such as port congestion, carrier issues, weather, and customs delays.",
  },
  {
    icon: AlertTriangle,
    title: "Rank exception priority",
    text: "Bring high-value, high-priority shipments to the top with risk explanations planners can review quickly.",
  },
  {
    icon: Route,
    title: "Compare response scenarios",
    text: "Evaluate wait, notify, reroute, split, and expedite options with cost, ETA, customer risk, and complexity.",
  },
  {
    icon: ClipboardCheck,
    title: "Approve the action",
    text: "Keep the human in control. Every approve, defer, or reject decision is stored with notes for the audit trail.",
  },
  {
    icon: History,
    title: "Review pilot value",
    text: "Export weekly summaries showing reviewed decisions, protected shipment value, top risks, and alert delivery health.",
  },
];

const scenarioRows = [
  ["Wait", "No direct cost", "+1-2 days", "High"],
  ["Notify", "Low", "No recovery", "Medium"],
  ["Reroute", "Medium", "Save 1 day", "Medium"],
  ["Split", "Medium", "Protect partial demand", "Low"],
  ["Expedite", "High", "Fastest recovery", "Low"],
];

export default function RMRoadsProductPage() {
  return (
    <div className="bg-background text-foreground">
      <main className="rmr-grid-bg overflow-hidden">
        <Hero />
        <Workflow />
        <WorkbenchPreview />
        <ControlLayer />
        <FinalCta />
      </main>
      <Footer footerNavigation={footerNavigation} />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative border-b border-border/30 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-center">
        <div className="min-w-0">
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-[4rem] lg:leading-[1.02]">
            Disruption response workbench for shipment planners.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            RMRoads AI helps logistics teams rank shipment risk, compare recovery options, and approve response actions before delays become customer failures.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button className="rmr-label h-12 rounded bg-secondary px-6 text-secondary-foreground hover:bg-secondary-muted" asChild>
              <WaspRouterLink to={routes.RMRoadsPilotRoute.to}>
                Book a disruption audit
              </WaspRouterLink>
            </Button>
            <Button className="rmr-label h-12 rounded border-border/70 px-6" variant="outline" asChild>
              <WaspRouterLink to={routes.RMRoadsDashboardRoute.to}>
                Open workspace <ArrowRight className="ml-2 size-4" />
              </WaspRouterLink>
            </Button>
          </div>
        </div>

        <div className="rmr-panel relative min-h-[34rem] overflow-hidden bg-[#03111f] p-0 text-slate-100">
          <div className="absolute inset-0 rmr-grid-bg opacity-80" />
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 900 560" role="img" aria-label="Shipment exception network">
            <path d="M70 420 C230 252 360 250 470 300 S690 280 835 110" fill="none" stroke="#4cd7f6" strokeOpacity="0.75" strokeWidth="2" />
            <path d="M120 120 C244 178 340 160 455 230 S650 362 820 304" fill="none" stroke="#a1cfcf" strokeOpacity="0.25" strokeWidth="1.5" />
            <path d="M150 500 C288 420 390 430 520 350 S680 174 790 176" fill="none" stroke="#4cd7f6" strokeOpacity="0.22" strokeWidth="1.5" />
            {[
              [70, 420, "VRC"],
              [470, 300, "HUB"],
              [835, 110, "ATL"],
              [120, 120, "SHA"],
              [820, 304, "LAX"],
              [150, 500, "FRA"],
              [790, 176, "JFK"],
            ].map(([x, y, label]) => (
              <g key={label as string}>
                <circle cx={x as number} cy={y as number} r="5" fill="#4cd7f6" />
                <text x={(x as number) + 10} y={(y as number) - 8} fill="#d4e4fa" fontSize="11" fontFamily="Geist">{label}</text>
              </g>
            ))}
            <circle cx="835" cy="110" r="15" fill="#ffb4ab" fillOpacity="0.12" stroke="#ffb4ab" />
          </svg>
          <div className="absolute left-4 top-4 w-[min(22rem,calc(100%-2rem))] rounded border border-border/40 bg-background/90 p-4 text-foreground backdrop-blur">
            <div className="rmr-label flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-4" /> Critical exception
            </div>
            <div className="mt-3 text-lg font-semibold">SHP-1001 at risk</div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Port congestion and high customer priority push this shipment to the top of the queue.</p>
          </div>
          <div className="absolute bottom-4 right-4 w-[min(24rem,calc(100%-2rem))] rounded border border-secondary/40 bg-background/90 p-4 text-foreground backdrop-blur">
            <div className="mb-3 flex items-center justify-between border-b border-border/30 pb-3">
              <span className="rmr-label text-secondary">Scenario ready</span>
              <span className="rmr-data">95/100</span>
            </div>
            <div className="grid gap-2 text-sm">
              <span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-secondary" /> Expedite protects priority customer.</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-secondary" /> Planner approval required.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Workflow() {
  return (
    <section className="border-b border-border/30 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold sm:text-3xl">A narrow pilot workflow that proves value fast.</h2>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            The MVP focuses on decisions before automation: find exposed shipments, recommend a response, and store the approval trail.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {workflow.map((item, index) => (
            <div className="rmr-panel min-w-0 p-5" key={item.title}>
              <div className="mb-5 flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded border border-secondary/30 bg-secondary/10 text-secondary">
                  <item.icon className="size-5" />
                </div>
                <span className="rmr-data text-muted-foreground">0{index + 1}</span>
              </div>
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkbenchPreview() {
  return (
    <section className="border-b border-border/30 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="rmr-panel overflow-hidden">
          <div className="border-b border-border/30 bg-card-subtle/70 px-4 py-3">
            <div className="rmr-label flex items-center gap-2 text-secondary">
              <Database className="size-4" /> Exception queue
            </div>
          </div>
          <div className="grid grid-cols-12 gap-2 border-b border-border/30 px-4 py-3 text-[11px] font-bold uppercase text-muted-foreground">
            <div className="col-span-3">Shipment</div>
            <div className="col-span-3">Lane</div>
            <div className="col-span-3">Risk reason</div>
            <div className="col-span-2 text-right">Value</div>
            <div className="col-span-1 text-right">Risk</div>
          </div>
          {[
            ["Northstar Retail", "SHP-1001", "Veracruz -> Atlanta", "Port congestion", "$185k", "95"],
            ["Atlas Medical", "SHP-1002", "Shanghai -> Long Beach", "Carrier delay", "$98k", "84"],
            ["Foundry Parts", "SHP-1003", "Hamburg -> Chicago", "Customs hold", "$72k", "78"],
          ].map((row, index) => (
            <div className={index === 0 ? "grid grid-cols-12 gap-2 border-b border-destructive/30 bg-destructive/10 px-4 py-4" : "grid grid-cols-12 gap-2 border-b border-border/20 px-4 py-4"} key={row[1]}>
              <div className="col-span-3 min-w-0">
                <div className="truncate text-sm font-semibold">{row[0]}</div>
                <div className="rmr-data truncate text-muted-foreground">{row[1]}</div>
              </div>
              <div className="rmr-data col-span-3 min-w-0 truncate text-muted-foreground">{row[2]}</div>
              <div className="col-span-3 min-w-0 truncate text-sm">{row[3]}</div>
              <div className="rmr-data col-span-2 text-right">{row[4]}</div>
              <div className={index === 0 ? "rmr-data col-span-1 text-right text-destructive" : "rmr-data col-span-1 text-right text-secondary"}>{row[5]}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-4">
          <div className="rmr-panel p-5">
            <div className="rmr-label mb-3 flex items-center gap-2 text-secondary">
              <Truck className="size-4" /> Shipment detail
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Metric label="Customer" value="Northstar Retail" />
              <Metric label="Carrier" value="Maersk" />
              <Metric label="ETA" value="2026-06-02" />
              <Metric label="Value" value="$185k" />
            </div>
          </div>
          <div className="rmr-panel overflow-hidden">
            <div className="border-b border-border/30 px-5 py-4">
              <div className="rmr-label flex items-center gap-2 text-secondary">
                <Network className="size-4" /> Scenario comparison
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 px-5 py-3 text-[11px] font-bold uppercase text-muted-foreground">
              <div>Action</div>
              <div>Cost</div>
              <div>ETA</div>
              <div>Customer risk</div>
            </div>
            {scenarioRows.map((row) => (
              <div className={row[0] === "Expedite" ? "grid grid-cols-4 gap-2 border-t border-secondary/30 bg-secondary/10 px-5 py-3 text-sm" : "grid grid-cols-4 gap-2 border-t border-border/20 px-5 py-3 text-sm"} key={row[0]}>
                {row.map((cell) => <div className="min-w-0 truncate" key={cell}>{cell}</div>)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ControlLayer() {
  return (
    <section className="border-b border-border/30 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-3">
        {[
          ["Human approval", "Recommendations are decision support. The planner approves, defers, or rejects every action."],
          ["Explainable scoring", "Risk reasons stay visible beside the recommendation so the team can challenge bad assumptions."],
          ["Tenant-scoped data", "Workspace data is tied to the organization, with admin-only settings and pre-pilot access review."],
        ].map(([title, text]) => (
          <div className="rmr-panel p-6" key={title}>
            <ShieldCheck className="mb-5 size-9 text-secondary" />
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Use the pilot to prove decision speed.</h2>
        <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
          Start with a 30-45 day disruption audit on active shipments, then review decisions and protected value weekly.
        </p>
        <Button className="rmr-label mt-8 h-12 rounded bg-secondary px-6 text-secondary-foreground hover:bg-secondary-muted" asChild>
          <WaspRouterLink to={routes.RMRoadsPilotRoute.to}>
            Book a disruption audit
          </WaspRouterLink>
        </Button>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border/40 bg-card-subtle/70 p-3">
      <div className="rmr-label text-muted-foreground">{label}</div>
      <div className="rmr-data mt-1 text-foreground">{value}</div>
    </div>
  );
}
