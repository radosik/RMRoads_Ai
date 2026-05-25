import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";

type Row = {
  id: string;
  customer: string;
  lane: string;
  reason: string;
  risk: number;
  state: "critical" | "high" | "medium";
};

const ROWS: Row[] = [
  {
    id: "SHP-1001",
    customer: "Northstar Retail",
    lane: "Veracruz → Atlanta",
    reason: "Port congestion",
    risk: 95,
    state: "critical",
  },
  {
    id: "SHP-1002",
    customer: "Atlas Medical",
    lane: "Shanghai → Long Beach",
    reason: "Carrier delay",
    risk: 84,
    state: "high",
  },
  {
    id: "SHP-1003",
    customer: "Foundry Parts",
    lane: "Hamburg → Chicago",
    reason: "Customs hold",
    risk: 78,
    state: "high",
  },
  {
    id: "SHP-1004",
    customer: "Helix Coffee",
    lane: "Long Beach → Phoenix",
    reason: "Weather risk",
    risk: 62,
    state: "medium",
  },
];

const SCENARIOS: Array<{ action: string; cost: string; eta: string; primary?: boolean }> = [
  { action: "Wait", cost: "$0", eta: "+2d" },
  { action: "Reroute", cost: "$3.4k", eta: "+1d" },
  { action: "Expedite", cost: "$8.1k", eta: "−6h", primary: true },
];

function stateBadge(state: Row["state"]): string {
  switch (state) {
    case "critical":
      return "bg-destructive/15 text-destructive border-destructive/40";
    case "high":
      return "bg-amber-500/15 text-amber-300 border-amber-400/40";
    default:
      return "bg-secondary/15 text-secondary border-secondary/30";
  }
}

export function RMRoadsWorkbenchPreview() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const rows = Array.from(root.querySelectorAll<HTMLElement>("[data-rmr-row]"));
    const scenarioCard = root.querySelector<HTMLElement>("[data-rmr-scenario]");
    const criticalRow = root.querySelector<HTMLElement>("[data-rmr-critical]");

    rows.forEach((row) => {
      row.style.opacity = "0";
      row.style.transform = "translateX(14px)";
    });
    if (scenarioCard) {
      scenarioCard.style.opacity = "0";
      scenarioCard.style.transform = "translateY(16px)";
    }

    animate(rows, {
      opacity: [0, 1],
      translateX: [14, 0],
      duration: 600,
      delay: stagger(120, { start: 200 }),
      ease: "outQuad",
    });

    if (scenarioCard) {
      animate(scenarioCard, {
        opacity: [0, 1],
        translateY: [16, 0],
        duration: 600,
        delay: 200 + rows.length * 120 + 250,
        ease: "outQuad",
      });
    }

    if (criticalRow) {
      animate(criticalRow, {
        boxShadow: [
          { to: "0 0 0 rgba(255,180,171,0.0)", duration: 0 },
          { to: "0 0 18px rgba(255,180,171,0.35)", duration: 900 },
          { to: "0 0 0 rgba(255,180,171,0.0)", duration: 900 },
        ],
        delay: 200 + rows.length * 120 + 600,
        loop: true,
      });
    }
  }, []);

  return (
    <div
      ref={rootRef}
      className="grid h-full grid-rows-[auto_1fr_auto] gap-3 p-4 sm:p-5"
    >
      <div className="flex items-center justify-between border-b border-border/30 pb-3">
        <div className="rmr-label flex items-center gap-2 text-secondary">
          <span className="rmr-glow inline-block size-2 rounded-full bg-secondary" />
          Risk intelligence · Live
        </div>
        <div className="rmr-data text-muted-foreground">04 active</div>
      </div>

      <div className="min-h-0">
        <div className="grid grid-cols-[1.4fr_2fr_1.6fr_auto] gap-3 border-b border-border/20 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <div>Shipment</div>
          <div>Lane</div>
          <div>Reason</div>
          <div className="text-right">Risk</div>
        </div>
        <div className="mt-1 divide-y divide-border/10">
          {ROWS.map((row) => {
            const isCritical = row.state === "critical";
            return (
              <div
                key={row.id}
                data-rmr-row
                data-rmr-critical={isCritical || undefined}
                className={
                  "grid grid-cols-[1.4fr_2fr_1.6fr_auto] items-center gap-3 rounded px-2 py-3 text-sm " +
                  (isCritical
                    ? "border border-destructive/30 bg-destructive/10"
                    : "border border-transparent")
                }
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold text-foreground">{row.customer}</div>
                  <div className="rmr-data truncate text-muted-foreground">{row.id}</div>
                </div>
                <div className="rmr-data truncate text-foreground">{row.lane}</div>
                <div className="truncate text-muted-foreground">{row.reason}</div>
                <div
                  className={
                    "rmr-data justify-self-end rounded border px-2 py-0.5 " + stateBadge(row.state)
                  }
                >
                  {row.risk}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        data-rmr-scenario
        className="rounded border border-secondary/40 bg-card-subtle/70 p-3 backdrop-blur"
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="rmr-label text-secondary">Scenario ready · SHP-1001</span>
          <span className="rmr-label rounded bg-secondary/15 px-2 py-0.5 text-secondary">
            95/100
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-sm">
          {SCENARIOS.map((s) => (
            <div
              key={s.action}
              className={
                "rounded border px-2 py-2 " +
                (s.primary
                  ? "border-secondary/60 bg-secondary/15 text-foreground"
                  : "border-border/30 bg-background/40 text-muted-foreground")
              }
            >
              <div className="rmr-label">{s.action}</div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="rmr-data">{s.cost}</span>
                <span className="rmr-data">{s.eta}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Planner approval required</span>
          <div className="flex gap-2">
            <button className="rmr-label rounded border border-border/40 px-2 py-1 text-muted-foreground hover:text-foreground">
              Defer
            </button>
            <button className="rmr-label rounded bg-secondary px-3 py-1 text-secondary-foreground">
              Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
