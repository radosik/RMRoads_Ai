import { useEffect } from "react";
import { animate, stagger } from "animejs";
import { useTranslation } from "react-i18next";
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
import { RMRoadsFooter } from "./RMRoadsFooter";
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

const workflowSteps = [
  { icon: FileSpreadsheet, id: "import" },
  { icon: Radar, id: "detect" },
  { icon: AlertTriangle, id: "rank" },
  { icon: Route, id: "compare" },
  { icon: ClipboardCheck, id: "approve" },
  { icon: History, id: "review" },
] as const;

const scenarioRowIds = ["wait", "notify", "reroute", "split", "expedite"] as const;
const controlCardIds = ["approval", "scoring", "tenant"] as const;

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
      <RMRoadsFooter />
    </div>
  );
}

function Hero() {
  const { t } = useTranslation();
  return (
    <section className="rmr-reveal-section relative border-b border-border/30 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-center">
        <div className="min-w-0">
          <div className="rmr-reveal rmr-label mb-6 inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-secondary">
            <span className="rmr-glow size-2 rounded-full bg-secondary" />
            {t("landing.hero.systemActive")}
          </div>
          <h1 className="rmr-reveal max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-[4rem] lg:leading-[1.02]">
            {t("landing.hero.headline")}
          </h1>
          <p className="rmr-reveal mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            {t("landing.hero.subtitle")}
          </p>
          <div className="rmr-reveal mt-8 flex flex-col gap-3 sm:flex-row">
            <Button className="rmr-label h-12 rounded bg-secondary px-6 text-secondary-foreground hover:bg-secondary-muted" asChild>
              <WaspRouterLink to={routes.RMRoadsPilotRoute.to}>
                {t("landing.hero.ctaPrimary")}
              </WaspRouterLink>
            </Button>
            <Button className="rmr-label h-12 rounded border-border/70 px-6" variant="outline" asChild>
              <WaspRouterLink to={routes.RMRoadsDashboardRoute.to}>
                <PlayCircle className="mr-2 size-4" /> {t("landing.hero.ctaSecondary")}
              </WaspRouterLink>
            </Button>
          </div>
        </div>

        <div className="rmr-reveal rmr-panel relative min-h-[34rem] overflow-hidden bg-card text-foreground">
          <div className="pointer-events-none absolute inset-0 rmr-grid-bg opacity-40" />
          <RMRoadsWorkbenchPreview />
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  const { t } = useTranslation();
  const problems: Array<{
    value: number;
    suffix?: string;
    unit: string;
    label: string;
    detail: string;
  }> = [
    {
      value: 37,
      unit: t("landing.problem.stats.detect.unit"),
      label: t("landing.problem.stats.detect.label"),
      detail: t("landing.problem.stats.detect.detail"),
    },
    {
      value: 5,
      suffix: "+",
      unit: t("landing.problem.stats.tools.unit"),
      label: t("landing.problem.stats.tools.label"),
      detail: t("landing.problem.stats.tools.detail"),
    },
    {
      value: 0,
      unit: t("landing.problem.stats.audit.unit"),
      label: t("landing.problem.stats.audit.label"),
      detail: t("landing.problem.stats.audit.detail"),
    },
  ];
  return (
    <section className="rmr-reveal-section border-b border-border/30 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <span className="rmr-reveal rmr-label inline-flex items-center gap-2 rounded-full border border-border/40 bg-card-subtle/60 px-3 py-1 text-muted-foreground">
            {t("landing.problem.tag")}
          </span>
          <h2 className="rmr-reveal mt-5 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            {t("landing.problem.headline")}
          </h2>
          <p className="rmr-reveal mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
            {t("landing.problem.subtitle")}
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {problems.map((p) => (
            <div className="rmr-reveal rmr-panel min-w-0 p-6 transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-secondary/40" key={p.label}>
              <div className="flex flex-wrap items-baseline gap-x-1 gap-y-1">
                <span
                  className="text-5xl font-bold tracking-tight text-foreground tabular-nums"
                  data-rmr-counter={p.value}
                >
                  {p.value}
                </span>
                {p.suffix ? (
                  <span className="text-5xl font-bold tracking-tight text-foreground">{p.suffix}</span>
                ) : null}
                <span className="rmr-label ml-2 break-words text-muted-foreground">{p.unit}</span>
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
  const { t } = useTranslation();
  return (
    <section className="rmr-reveal-section border-b border-border/30 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <h2 className="rmr-reveal text-2xl font-semibold sm:text-3xl">{t("landing.workflow.title")}</h2>
          <p className="rmr-reveal mt-4 text-sm leading-6 text-muted-foreground">
            {t("landing.workflow.subtitle")}
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {workflowSteps.map((item, index) => (
            <div className="rmr-reveal rmr-panel min-w-0 p-5 transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-secondary/40" key={item.id}>
              <div className="mb-5 flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded border border-secondary/30 bg-secondary/10 text-secondary">
                  <item.icon className="size-5" />
                </div>
                <span className="rmr-data text-muted-foreground">0{index + 1}</span>
              </div>
              <h3 className="text-lg font-semibold">{t(`landing.workflow.steps.${item.id}.title`)}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{t(`landing.workflow.steps.${item.id}.text`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkbenchPreview() {
  const { t } = useTranslation();
  const exceptionRows = [
    { id: "SHP-1001", customer: "Northstar Retail", lane: "Veracruz → Atlanta", reasonKey: "portCongestion", value: "$185k", risk: "95" },
    { id: "SHP-1002", customer: "Atlas Medical", lane: "Shanghai → Long Beach", reasonKey: "carrierDelay", value: "$98k", risk: "84" },
    { id: "SHP-1003", customer: "Foundry Parts", lane: "Hamburg → Chicago", reasonKey: "customsHold", value: "$72k", risk: "78" },
  ];
  return (
    <section className="rmr-reveal-section border-b border-border/30 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="rmr-reveal rmr-panel overflow-hidden">
          <div className="border-b border-border/30 bg-card-subtle/70 px-4 py-3">
            <div className="rmr-label flex items-center gap-2 text-secondary">
              <Database className="size-4" /> {t("landing.preview.exceptionQueue")}
            </div>
          </div>
          <div className="grid grid-cols-12 gap-2 border-b border-border/30 px-4 py-3 text-[11px] font-bold uppercase text-muted-foreground">
            <div className="col-span-3">{t("landing.preview.cols.shipment")}</div>
            <div className="col-span-3">{t("landing.preview.cols.lane")}</div>
            <div className="col-span-3">{t("landing.preview.cols.riskReason")}</div>
            <div className="col-span-2 text-right">{t("landing.preview.cols.value")}</div>
            <div className="col-span-1 text-right">{t("landing.preview.cols.risk")}</div>
          </div>
          {exceptionRows.map((row, index) => (
            <div className={index === 0 ? "grid grid-cols-12 gap-2 border-b border-destructive/30 bg-destructive/10 px-4 py-4" : "grid grid-cols-12 gap-2 border-b border-border/20 px-4 py-4"} key={row.id}>
              <div className="col-span-3 min-w-0">
                <div className="truncate text-sm font-semibold">{row.customer}</div>
                <div className="rmr-data truncate text-muted-foreground">{row.id}</div>
              </div>
              <div className="rmr-data col-span-3 min-w-0 truncate text-muted-foreground">{row.lane}</div>
              <div className="col-span-3 min-w-0 truncate text-sm">{t(`landing.preview.reasons.${row.reasonKey}`)}</div>
              <div className="rmr-data col-span-2 text-right">{row.value}</div>
              <div className={index === 0 ? "rmr-data col-span-1 text-right text-destructive" : "rmr-data col-span-1 text-right text-secondary"}>{row.risk}</div>
            </div>
          ))}
        </div>

        <div className="rmr-reveal grid gap-4">
          <div className="rmr-panel p-5">
            <div className="rmr-label mb-3 flex items-center gap-2 text-secondary">
              <Truck className="size-4" /> {t("landing.preview.shipmentDetail")}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Metric label={t("landing.preview.detail.customer")} value="Northstar Retail" />
              <Metric label={t("landing.preview.detail.carrier")} value="Maersk" />
              <Metric label={t("landing.preview.detail.eta")} value="2026-06-02" />
              <Metric label={t("landing.preview.detail.value")} value="$185k" />
            </div>
          </div>
          <div className="rmr-panel overflow-hidden">
            <div className="border-b border-border/30 px-5 py-4">
              <div className="rmr-label flex items-center gap-2 text-secondary">
                <Network className="size-4" /> {t("landing.preview.scenarioComparison")}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 px-5 py-3 text-[11px] font-bold uppercase text-muted-foreground">
              <div>{t("landing.preview.scenarioCols.action")}</div>
              <div>{t("landing.preview.scenarioCols.cost")}</div>
              <div>{t("landing.preview.scenarioCols.eta")}</div>
              <div>{t("landing.preview.scenarioCols.customerRisk")}</div>
            </div>
            {scenarioRowIds.map((id) => (
              <div className={id === "expedite" ? "grid grid-cols-4 gap-2 border-t border-secondary/30 bg-secondary/10 px-5 py-3 text-sm" : "grid grid-cols-4 gap-2 border-t border-border/20 px-5 py-3 text-sm"} key={id}>
                <div className="min-w-0 truncate">{t(`landing.preview.scenarios.${id}.action`)}</div>
                <div className="min-w-0 truncate">{t(`landing.preview.scenarios.${id}.cost`)}</div>
                <div className="min-w-0 truncate">{t(`landing.preview.scenarios.${id}.eta`)}</div>
                <div className="min-w-0 truncate">{t(`landing.preview.scenarios.${id}.customerRisk`)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ControlLayer() {
  const { t } = useTranslation();
  return (
    <section className="rmr-reveal-section border-b border-border/30 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-3">
        {controlCardIds.map((id) => (
          <div className="rmr-reveal rmr-panel p-6 transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-secondary/40" key={id}>
            <ShieldCheck className="mb-5 size-9 text-secondary" />
            <h3 className="text-lg font-semibold">{t(`landing.controlLayer.${id}.title`)}</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{t(`landing.controlLayer.${id}.text`)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  const { t } = useTranslation();
  return (
    <section className="rmr-reveal-section px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <h2 className="rmr-reveal text-3xl font-semibold tracking-tight sm:text-4xl">{t("landing.finalCta.title")}</h2>
        <p className="rmr-reveal mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
          {t("landing.finalCta.body")}
        </p>
        <Button className="rmr-reveal rmr-label mt-8 h-12 rounded bg-secondary px-6 text-secondary-foreground hover:bg-secondary-muted" asChild>
          <WaspRouterLink to={routes.RMRoadsPilotRoute.to}>
            {t("landing.finalCta.cta")}
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
