import { useEffect } from "react";
import { animate, stagger } from "animejs";
import {
  AlertTriangle,
  ClipboardCheck,
  Database,
  FileSpreadsheet,
  History,
  Network,
  PlayCircle,
  Radar,
  Route,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { Link as WaspRouterLink, routes } from "wasp/client/router";
import { Button } from "../client/components/ui/button";
import Footer from "../landing-page/components/Footer";
import { footerNavigation } from "../landing-page/contentSections";
import { RMRoadsWorkbenchPreview } from "./RMRoadsWorkbenchPreview";

function useScrollReveal() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>(".rmr-reveal-section"),
    );
    if (sections.length === 0) return;

    if (reduceMotion) {
      sections.forEach((section) =>
        section.querySelectorAll<HTMLElement>(".rmr-reveal").forEach((el) => {
          el.style.opacity = "1";
          el.style.transform = "none";
        }),
      );
      return;
    }

    sections.forEach((section) =>
      section.querySelectorAll<HTMLElement>(".rmr-reveal").forEach((el) => {
        el.style.opacity = "0";
        el.style.transform = "translateY(22px)";
      }),
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const targets = Array.from(
            entry.target.querySelectorAll<HTMLElement>(".rmr-reveal"),
          );
          if (targets.length > 0) {
            animate(targets, {
              opacity: [0, 1],
              translateY: [22, 0],
              duration: 700,
              delay: stagger(80),
              ease: "outQuad",
            });
          }
          const counters = Array.from(
            entry.target.querySelectorAll<HTMLElement>("[data-rmr-counter]"),
          );
          counters.forEach((el) => {
            const target = Number(el.dataset.rmrCounter ?? "0");
            const state = { value: 0 };
            el.textContent = "0";
            animate(state, {
              value: target,
              duration: 1100,
              ease: "outCubic",
              onUpdate: () => {
                el.textContent = String(Math.round(state.value));
              },
            });
          });
          if (targets.length === 0 && counters.length === 0) return;
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.18 },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);
}

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
  useScrollReveal();
  return (
    <div className="bg-background text-foreground">
      <main className="rmr-grid-bg overflow-hidden">
        <Hero />
        <ProblemSection />
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
    <section className="rmr-reveal-section relative border-b border-border/30 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-center">
        <div className="min-w-0">
          <div className="rmr-reveal rmr-label mb-6 inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-secondary">
            <span className="rmr-glow size-2 rounded-full bg-secondary" />
            SYSTEM ACTIVE
          </div>
          <h1 className="rmr-reveal max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-[4rem] lg:leading-[1.02]">
            Rank shipment risk, compare recovery options.
          </h1>
          <p className="rmr-reveal mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Approve response actions before delays hit customers. High-stakes logistics operations demand precision, not fragmented alerts.
          </p>
          <div className="rmr-reveal mt-8 flex flex-col gap-3 sm:flex-row">
            <Button className="rmr-label h-12 rounded bg-secondary px-6 text-secondary-foreground hover:bg-secondary-muted" asChild>
              <WaspRouterLink to={routes.RMRoadsPilotRoute.to}>
                Book a disruption audit
              </WaspRouterLink>
            </Button>
            <Button className="rmr-label h-12 rounded border-border/70 px-6" variant="outline" asChild>
              <WaspRouterLink to={routes.RMRoadsDashboardRoute.to}>
                <PlayCircle className="mr-2 size-4" /> See the workflow
              </WaspRouterLink>
            </Button>
          </div>
        </div>

        <div className="rmr-reveal rmr-panel relative min-h-[34rem] overflow-hidden bg-[#03111f] text-slate-100">
          <div className="pointer-events-none absolute inset-0 rmr-grid-bg opacity-40" />
          <RMRoadsWorkbenchPreview />
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  const problems: Array<{
    value: number;
    suffix?: string;
    unit: string;
    label: string;
    detail: string;
  }> = [
    {
      value: 37,
      unit: "min",
      label: "Avg. time to detect a shipment exception today",
      detail: "Planners scan carrier portals, spreadsheets, and email threads to spot risk.",
    },
    {
      value: 5,
      suffix: "+",
      unit: "tools",
      label: "Systems touched before a recovery decision",
      detail: "TMS, ERP, customer CRM, supplier emails, and offline notes all weigh in.",
    },
    {
      value: 0,
      unit: "audit",
      label: "Decisions captured with reasoning for the next review",
      detail: "Outcomes vanish in chat threads — there is no system of record for response.",
    },
  ];
  return (
    <section className="rmr-reveal-section border-b border-border/30 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <span className="rmr-reveal rmr-label inline-flex items-center gap-2 rounded-full border border-border/40 bg-card-subtle/60 px-3 py-1 text-muted-foreground">
            The pain point
          </span>
          <h2 className="rmr-reveal mt-5 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            Disruptions are not the hard part. Deciding what to do next is.
          </h2>
          <p className="rmr-reveal mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
            Port congestion, carrier delays, weather, and customs issues surface in too many places and too late. By the time the team agrees on a response, the customer is already feeling the delay.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {problems.map((p) => (
            <div className="rmr-reveal rmr-panel min-w-0 p-6 transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-secondary/40" key={p.label}>
              <div className="flex items-baseline gap-1">
                <span
                  className="text-5xl font-bold tracking-tight text-foreground tabular-nums"
                  data-rmr-counter={p.value}
                >
                  {p.value}
                </span>
                {p.suffix ? (
                  <span className="text-5xl font-bold tracking-tight text-foreground">{p.suffix}</span>
                ) : null}
                <span className="rmr-label ml-2 text-muted-foreground">{p.unit}</span>
              </div>
              <div className="mt-4 text-sm font-semibold text-foreground">{p.label}</div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{p.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Workflow() {
  return (
    <section className="rmr-reveal-section border-b border-border/30 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <h2 className="rmr-reveal text-2xl font-semibold sm:text-3xl">A narrow pilot workflow that proves value fast.</h2>
          <p className="rmr-reveal mt-4 text-sm leading-6 text-muted-foreground">
            The MVP focuses on decisions before automation: find exposed shipments, recommend a response, and store the approval trail.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {workflow.map((item, index) => (
            <div className="rmr-reveal rmr-panel min-w-0 p-5 transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-secondary/40" key={item.title}>
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
    <section className="rmr-reveal-section border-b border-border/30 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="rmr-reveal rmr-panel overflow-hidden">
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

        <div className="rmr-reveal grid gap-4">
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
    <section className="rmr-reveal-section border-b border-border/30 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-3">
        {[
          ["Human approval", "Recommendations are decision support. The planner approves, defers, or rejects every action."],
          ["Explainable scoring", "Risk reasons stay visible beside the recommendation so the team can challenge bad assumptions."],
          ["Tenant-scoped data", "Workspace data is tied to the organization, with admin-only settings and pre-pilot access review."],
        ].map(([title, text]) => (
          <div className="rmr-reveal rmr-panel p-6 transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-secondary/40" key={title}>
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
    <section className="rmr-reveal-section px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <h2 className="rmr-reveal text-3xl font-semibold tracking-tight sm:text-4xl">Use the pilot to prove decision speed.</h2>
        <p className="rmr-reveal mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
          Start with a 30-45 day disruption audit on active shipments, then review decisions and protected value weekly.
        </p>
        <Button className="rmr-reveal rmr-label mt-8 h-12 rounded bg-secondary px-6 text-secondary-foreground hover:bg-secondary-muted" asChild>
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
