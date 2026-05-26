import { animate } from "animejs/animation";
import { Link as ReactRouterLink } from "react-router";
import { routes } from "wasp/client/router";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FileText,
  Plus,
  Settings,
  Truck,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import {
  decideRMRoadsException,
  getRMRoadsDashboard,
  importRMRoadsShipmentCsv,
  seedRMRoadsDemoData,
  toggleRMRoadsDisruptionEventStatus,
  upsertRMRoadsDisruptionEvent,
  updateRMRoadsDecisionOutcome,
  useQuery,
} from "wasp/client/operations";
import { Button } from "../client/components/ui/button";
import { Input } from "../client/components/ui/input";
import { Label } from "../client/components/ui/label";
import { Textarea } from "../client/components/ui/textarea";
import { requiredShipmentCsvFields, type ImportError } from "./domain/csv";
import { buildPilotSummaryRows } from "./domain/pilotSummary";
import { generateRecommendation } from "./domain/recommendations";
import type {
  DisruptionSeverity,
  DisruptionEvent,
  RiskLevel,
  ScenarioAction,
} from "./domain/types";

const owners = ["Maya Chen", "Leo Martins", "Nina Patel", "Ops Review"];
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function shouldRunMotion() {
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const shipmentCsvTemplateRows = [
  requiredShipmentCsvFields,
  [
    "SHP-1001",
    "Northstar Retail",
    "Los Angeles CA",
    "Chicago IL",
    "Ocean",
    "Maersk",
    "2026-05-25",
    "2026-06-02",
    "critical",
    "185000",
    "Electronics",
    "Midwest DC",
  ],
  [
    "SHP-1002",
    "Atlas Medical",
    "Shanghai CN",
    "Long Beach CA",
    "Ocean",
    "CMA CGM",
    "2026-05-26",
    "2026-06-08",
    "high",
    "98000",
    "Medical Supplies",
    "West Coast DC",
  ],
];

const defaultSignalForm = {
  type: "Port congestion",
  severity: "high" as DisruptionSeverity,
  affectedText: "",
  mode: "",
  carrier: "",
  confidence: 75,
  source: "Planner report",
  startsAt: "",
  expiresAt: "",
};

export default function RMRoadsDashboardPage() {
  const [importMessage, setImportMessage] = useState("");
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [carrierFilter, setCarrierFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const [queueSearch, setQueueSearch] = useState("");
  const [selectedExceptionId, setSelectedExceptionId] = useState("");
  const [selectedScenarioAction, setSelectedScenarioAction] = useState<ScenarioAction | "">("");
  const [decisionNote, setDecisionNote] = useState("");
  const [decisionError, setDecisionError] = useState("");
  const [signalForm, setSignalForm] = useState(defaultSignalForm);
  const [signalMessage, setSignalMessage] = useState("");
  const dashboardQuery = useQuery(getRMRoadsDashboard);
  const dashboard = dashboardQuery.data;
  const shipments = dashboard?.shipments || [];
  const exceptions = dashboard?.exceptions || [];
  const selectedException = exceptions.find((exception) => exception.id === selectedExceptionId) || exceptions[0];
  const selectedExceptionShipment = selectedException
    ? shipments.find((shipment) => shipment.id === selectedException.shipmentId)
    : undefined;
  const activeShipment = selectedExceptionShipment;
  const recommendation =
    selectedException && selectedExceptionShipment
      ? generateRecommendation(selectedException, selectedExceptionShipment)
      : undefined;
  const latestSelectedDecision = selectedException
    ? dashboard?.decisions.find((decision: any) => decision.exceptionId === selectedException.id)
    : undefined;
  const selectedAction =
    selectedScenarioAction || selectedException?.selectedScenarioAction || recommendation?.primaryAction || "watch";
  const carrierOptions = ["all", ...Array.from(new Set(shipments.map((shipment) => shipment.carrier).filter(Boolean))).sort()];
  const modeOptions = ["all", ...Array.from(new Set(shipments.map((shipment) => shipment.mode).filter(Boolean))).sort()];

  const filteredExceptions = exceptions.filter((exception) => {
    const shipment = shipments.find((item) => item.id === exception.shipmentId);
    const normalizedSearch = queueSearch.trim().toLowerCase();
    const ownerMatch =
      ownerFilter === "all" ||
      (ownerFilter === "unassigned" && !exception.owner) ||
      exception.owner === ownerFilter;
    const statusMatch = statusFilter === "all" || exception.status === statusFilter;
    const riskMatch = riskFilter === "all" || exception.riskLevel === riskFilter;
    const carrierMatch = carrierFilter === "all" || shipment?.carrier === carrierFilter;
    const modeMatch = modeFilter === "all" || shipment?.mode === modeFilter;
    const searchMatch =
      !normalizedSearch ||
      [
        exception.customer,
        exception.shipmentId,
        exception.lane,
        exception.reason,
        shipment?.carrier || "",
        shipment?.mode || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    return ownerMatch && statusMatch && riskMatch && carrierMatch && modeMatch && searchMatch;
  });

  const refreshDashboard = async () => {
    await dashboardQuery.refetch();
  };

  const handleSeedDemoData = async () => {
    await seedRMRoadsDemoData();
    setImportMessage("");
    setImportErrors([]);
    await refreshDashboard();
  };

  const handleCsvImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const result = await importRMRoadsShipmentCsv({
        csvText: await file.text(),
        sourceName: file.name,
      });
      setImportMessage(
        `Imported ${result.acceptedCount} shipments. ${result.rejectedCount} rows rejected, ${result.duplicateCount} duplicates.`,
      );
      setImportErrors(result.errors);
      setSelectedExceptionId("");
      await refreshDashboard();
    } catch (error: any) {
      setImportMessage(error.message || "CSV import failed.");
      setImportErrors([]);
    } finally {
      setIsImporting(false);
      event.currentTarget.value = "";
    }
  };

  const handleDownloadTemplate = () => {
    downloadCsv(
      `rmroads-shipment-template-${new Date().toISOString().slice(0, 10)}.csv`,
      shipmentCsvTemplateRows,
    );
  };

  const handleDownloadPilotSummary = () => {
    if (!dashboard) return;

    downloadCsv(
      `rmroads-pilot-summary-${new Date().toISOString().slice(0, 10)}.csv`,
      buildPilotSummaryRows({
        organizationName: dashboard.organization?.name || "",
        shipmentCount: dashboard.shipmentCount,
        eventCount: dashboard.eventCount,
        exceptionCount: dashboard.exceptionCount,
        criticalExceptionCount: dashboard.criticalExceptionCount,
        totalValue: dashboard.totalValue,
        reviewedCount: dashboard.reviewedCount,
        approvedCount: dashboard.approvedCount,
        deferredCount: dashboard.deferredCount,
        rejectedCount: dashboard.rejectedCount,
        averageRiskScore: dashboard.averageRiskScore,
        estimatedProtectedValue: dashboard.estimatedProtectedValue,
        averageResponseHours: dashboard.averageResponseHours,
        shipments: dashboard.shipments,
        exceptions: dashboard.exceptions,
        decisions: dashboard.decisions,
        alerts: dashboard.alerts,
        importHistory: dashboard.importHistory,
      }),
    );
  };

  const handleSignalSubmit = async () => {
    setSignalMessage("");
    try {
      await upsertRMRoadsDisruptionEvent(signalForm);
      setSignalForm(defaultSignalForm);
      setSignalMessage("Signal saved.");
      await refreshDashboard();
    } catch (error: any) {
      setSignalMessage(error.message || "Could not save signal.");
    }
  };

  const handleToggleSignal = async (id: string) => {
    await toggleRMRoadsDisruptionEventStatus({ id });
    await refreshDashboard();
  };

  const handleDecision = async (status: "approved" | "deferred" | "rejected") => {
    if (!selectedException) return;
    if ((status === "deferred" || status === "rejected") && !decisionNote.trim()) {
      setDecisionError("Decision note is required for deferred or rejected recommendations.");
      return;
    }

    await decideRMRoadsException({
      exceptionId: selectedException.id,
      status,
      scenarioAction: selectedAction,
      note: decisionNote,
    });
    setDecisionError("");
    setDecisionNote("");
    await refreshDashboard();
  };

  const handleDecisionOutcome = async ({
    decisionId,
    outcomeNote,
    outcomeStatus,
  }: {
    decisionId: string;
    outcomeNote: string;
    outcomeStatus: "pending" | "monitoring" | "successful" | "failed";
  }) => {
    await updateRMRoadsDecisionOutcome({
      decisionId,
      outcomeNote,
      outcomeStatus,
    });
    await refreshDashboard();
  };

  return (
    <main className="rmr-workspace h-[calc(100vh-4rem)] overflow-hidden bg-background text-foreground">
      <div className="flex h-full overflow-hidden">
        <WorkbenchSideRail
          dashboard={dashboard}
          handleCsvImport={handleCsvImport}
          handleDownloadTemplate={handleDownloadTemplate}
          handleSeedDemoData={handleSeedDemoData}
          importErrors={importErrors}
          importMessage={importMessage}
          isImporting={isImporting}
          onSignalChange={setSignalForm}
          onSignalSubmit={handleSignalSubmit}
          onToggleSignal={handleToggleSignal}
          signalForm={signalForm}
          signalMessage={signalMessage}
        />

        <section className="flex h-full min-w-0 flex-1 flex-col bg-background">
          <WorkbenchContextBar
            dashboard={dashboard}
            dashboardQuery={dashboardQuery}
            exceptions={exceptions}
            handleDownloadPilotSummary={handleDownloadPilotSummary}
            handleSeedDemoData={handleSeedDemoData}
          />

          {dashboardQuery.isLoading ? (
            <div className="border-b border-border/30 bg-card-subtle/60 px-6 py-4 text-sm text-muted-foreground">
              Loading RMRoads workspace...
            </div>
          ) : null}

          {dashboardQuery.error ? (
            <div className="border-b border-destructive/40 bg-destructive/10 px-6 py-4 text-sm font-semibold text-destructive">
              Could not load the RMRoads workspace. Check the server logs and database connection.
            </div>
          ) : null}

          {!dashboardQuery.isLoading && shipments.length === 0 ? (
            <div className="m-4 rounded border border-secondary/40 bg-secondary/10 p-5">
              <h2 className="text-lg font-semibold">No shipment data yet</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Load the demo workspace or import a shipment CSV to start the workbench.
              </p>
              <Button className="rmr-label mt-4 rounded bg-secondary text-secondary-foreground hover:bg-secondary-muted" onClick={handleSeedDemoData}>
                Load Demo Workspace
              </Button>
            </div>
          ) : null}

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
            <WorkbenchExceptionQueue
              filteredExceptions={filteredExceptions}
              carrierFilter={carrierFilter}
              carrierOptions={carrierOptions}
              modeFilter={modeFilter}
              modeOptions={modeOptions}
              ownerFilter={ownerFilter}
              queueSearch={queueSearch}
              refreshDashboard={refreshDashboard}
              riskFilter={riskFilter}
              selectedExceptionId={selectedException?.id || ""}
              setCarrierFilter={setCarrierFilter}
              setModeFilter={setModeFilter}
              setOwnerFilter={setOwnerFilter}
              setQueueSearch={setQueueSearch}
              setRiskFilter={setRiskFilter}
              setSelectedExceptionId={(id: string) => {
                setSelectedExceptionId(id);
                setSelectedScenarioAction("");
                setDecisionNote("");
                setDecisionError("");
              }}
              setStatusFilter={setStatusFilter}
              statusFilter={statusFilter}
            />
            <WorkbenchDetailPanel
              activeShipment={activeShipment}
              decisionError={decisionError}
              decisionNote={decisionNote}
              handleDecision={handleDecision}
              latestDecision={latestSelectedDecision}
              handleDecisionOutcome={handleDecisionOutcome}
              recommendation={recommendation}
              selectedAction={selectedAction}
              selectedException={selectedException}
              setDecisionNote={setDecisionNote}
              setSelectedScenarioAction={setSelectedScenarioAction}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function WorkbenchSideRail({
  dashboard,
  handleCsvImport,
  handleDownloadTemplate,
  handleSeedDemoData,
  importErrors,
  importMessage,
  isImporting,
  onSignalChange,
  onSignalSubmit,
  onToggleSignal,
  signalForm,
  signalMessage,
}: any) {
  const activeSignals = (dashboard?.disruptionEvents || []).filter((event: DisruptionEvent) => event.status === "active");
  return (
    <aside className="hidden w-16 shrink-0 flex-col border-r border-border/30 bg-card-subtle transition-all duration-300 dark:bg-[#010f1f] md:flex lg:w-[var(--rmr-rail-width)]">
      <div className="hidden border-b border-border/30 p-[var(--rmr-panel-pad)] lg:block">
        <div className="rmr-label mb-1 flex items-center gap-2 text-secondary">
          <span className="size-2 rounded-full bg-secondary rmr-glow" />
          OPS CENTER
        </div>
        <div className="rmr-data text-muted-foreground" data-testid="rmroads-shipment-count">
          Active nodes: {dashboard?.shipmentCount || 0}
        </div>
      </div>
      <div className="flex justify-center border-b border-border/30 p-3 lg:hidden">
        <span className="mt-1 size-2 rounded-full bg-secondary rmr-glow" />
      </div>

      <div className="grid gap-2 border-b border-border/30 p-2 lg:p-[var(--rmr-panel-pad)]">
        <Button className="rmr-label justify-center rounded border-border/50 bg-card-subtle px-2 text-foreground hover:border-secondary hover:bg-muted lg:justify-start" data-testid="rmroads-seed-data-button" onClick={handleSeedDemoData}>
          <Plus className="size-4 lg:mr-2" />
          <span className="hidden lg:inline">{dashboard?.shipmentCount ? "Refresh Simulation" : "New Simulation"}</span>
        </Button>
        <Button className="rmr-label justify-center rounded px-2 lg:justify-start" onClick={handleDownloadTemplate} type="button" variant="outline">
          <FileText className="size-4 lg:mr-2" />
          <span className="hidden lg:inline">CSV Template</span>
        </Button>
        <label className="rmr-label flex h-9 cursor-pointer items-center justify-center rounded border border-border/50 bg-background/70 px-2 text-muted-foreground transition-colors hover:border-secondary hover:text-secondary lg:justify-start lg:px-3">
          <Database className="size-4 lg:mr-2" />
          <span className="hidden lg:inline">Import Shipments</span>
          <Input className="sr-only" accept=".csv,text/csv" disabled={isImporting} onChange={handleCsvImport} type="file" />
        </label>
        {importMessage ? <p className="hidden text-xs leading-5 text-secondary lg:block">{importMessage}</p> : null}
        {importErrors.length ? <div className="hidden lg:block"><ImportErrorsTable errors={importErrors} /></div> : null}
      </div>

      <div className="hidden min-h-0 border-b border-border/30 p-[var(--rmr-panel-pad)] lg:grid lg:max-h-[46vh] lg:gap-3 lg:overflow-y-auto rmr-scrollbar">
        <div>
          <div className="rmr-label text-secondary">Signals</div>
          <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
            Create active pilot signals that affect risk scoring.
          </p>
        </div>
        <Input
          aria-label="Signal type"
          className="h-8 text-xs"
          placeholder="Signal type"
          value={signalForm.type}
          onChange={(event) => onSignalChange((current: typeof defaultSignalForm) => ({ ...current, type: event.currentTarget.value }))}
        />
        <Input
          aria-label="Affected lane, carrier, or place"
          className="h-8 text-xs"
          placeholder="Affected lane, carrier, or place"
          value={signalForm.affectedText}
          onChange={(event) => onSignalChange((current: typeof defaultSignalForm) => ({ ...current, affectedText: event.currentTarget.value }))}
        />
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-[minmax(0,1fr)_5.25rem]">
          <NativeSelect
            label="Severity"
            value={signalForm.severity}
            onChange={(severity) => onSignalChange((current: typeof defaultSignalForm) => ({ ...current, severity }))}
            options={["low", "medium", "high", "critical"]}
          />
          <Input
            aria-label="Confidence"
            className="h-9 text-xs"
            min={1}
            max={100}
            type="number"
            value={signalForm.confidence}
            onChange={(event) => onSignalChange((current: typeof defaultSignalForm) => ({ ...current, confidence: Number(event.currentTarget.value) || 1 }))}
          />
        </div>
        <div className="grid gap-2">
          <label className="grid min-w-0 gap-1 text-xs font-semibold text-muted-foreground">
            Starts
            <Input
              aria-label="Signal starts at"
              className="h-8 min-w-0 text-xs"
              type="date"
              value={signalForm.startsAt}
              onChange={(event) => onSignalChange((current: typeof defaultSignalForm) => ({ ...current, startsAt: event.currentTarget.value }))}
            />
          </label>
          <label className="grid min-w-0 gap-1 text-xs font-semibold text-muted-foreground">
            Expires
            <Input
              aria-label="Signal expires at"
              className="h-8 min-w-0 text-xs"
              type="date"
              value={signalForm.expiresAt}
              onChange={(event) => onSignalChange((current: typeof defaultSignalForm) => ({ ...current, expiresAt: event.currentTarget.value }))}
            />
          </label>
        </div>
        <Button className="rmr-label h-8 rounded bg-secondary text-secondary-foreground hover:bg-secondary-muted" onClick={onSignalSubmit} type="button">
          Add Signal
        </Button>
        {signalMessage ? <p className="text-xs font-semibold text-secondary">{signalMessage}</p> : null}
        <div className="grid gap-2">
          {activeSignals.slice(0, 4).map((event: DisruptionEvent) => (
            <div className="rounded border border-border/40 bg-background/70 p-2.5" key={event.id}>
              <div className="grid gap-2">
                <div className="min-w-0">
                  <div className="break-words text-xs font-semibold leading-5">{event.type}</div>
                  <div className="mt-1 truncate text-[11px] text-muted-foreground">{event.affectedText}</div>
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    {event.startsAt || "Now"} - {event.expiresAt || "Open"}
                  </div>
                </div>
                <button className="rmr-label justify-self-start text-[10px] text-muted-foreground hover:text-destructive" onClick={() => onToggleSignal(event.id)} type="button">
                  Archive
                </button>
              </div>
            </div>
          ))}
          {!activeSignals.length ? <p className="text-xs text-muted-foreground">No active signals.</p> : null}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 rmr-scrollbar">
        <WorkbenchRailItem active icon={<AlertTriangle className="size-5" />} label="Disruptions" />
      </nav>

      <div className="border-t border-border/30 py-2">
        <WorkbenchRailItem href={routes.RMRoadsSettingsRoute.to} icon={<Settings className="size-5" />} label="Settings" />
      </div>
    </aside>
  );
}

function WorkbenchRailItem({
  active = false,
  href,
  icon,
  label,
}: {
  active?: boolean;
  href?: string;
  icon: ReactNode;
  label: string;
}) {
  const className = active
    ? "rmr-label flex w-full items-center justify-center gap-3 border-r-2 border-secondary bg-secondary/15 px-3 py-3 text-secondary lg:justify-start lg:px-6"
    : "rmr-label flex w-full items-center justify-center gap-3 px-3 py-3 text-muted-foreground transition-colors hover:bg-card-subtle/70 hover:text-secondary lg:justify-start lg:px-6";
  const content = (
    <>
      {icon}
      <span className="hidden lg:inline">{label}</span>
    </>
  );

  if (!href) {
    return (
      <div className={className}>
        {content}
      </div>
    );
  }

  return (
    <ReactRouterLink className={className} to={href}>
      {content}
    </ReactRouterLink>
  );
}

function WorkbenchContextBar({ dashboard, dashboardQuery, exceptions, handleDownloadPilotSummary, handleSeedDemoData }: any) {
  const criticalCount = exceptions.filter((exception: any) => exception.riskLevel === "critical").length;
  const actionableCount = exceptions.filter((exception: any) => exception.status === "new" || exception.status === "deferred").length;

  return (
    <div className="flex h-[var(--rmr-context-height)] shrink-0 items-center justify-between gap-4 border-b border-border/30 bg-card-subtle/85 px-[var(--rmr-page-pad)] backdrop-blur dark:bg-[#010f1f]/70">
      <div className="flex min-w-0 flex-wrap items-center gap-4">
        <h1 className="text-lg font-semibold leading-6">Exception Queue</h1>
        <div className="hidden h-5 w-px bg-border/60 sm:block" />
        <div className="rmr-data flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-2 text-destructive">
            <span className="size-2 rounded-full bg-destructive" /> {criticalCount} Critical
          </span>
          <span className="flex items-center gap-2 text-secondary">
            <span className="size-2 rounded-full bg-secondary" /> {actionableCount} Actionable
          </span>
          <span className="text-muted-foreground">{dashboard?.eventCount || 0} Active Signals</span>
        </div>
      </div>
      <div className="hidden items-center gap-3 lg:flex">
        <div className="flex items-center gap-5 rounded border border-border/40 bg-card-subtle/60 px-4 py-1">
          <MiniContextMetric label="Decisions" value={`${dashboard?.reviewedCount || 0}`} />
          <div className="h-7 w-px bg-border/50" />
          <MiniContextMetric label="Avg Response" value={formatHours(dashboard?.averageResponseHours || 0)} />
          <div className="h-7 w-px bg-border/50" />
          <MiniContextMetric label="Value Protected" value={currencyFormatter.format(dashboard?.estimatedProtectedValue || 0)} accent />
          <div className="hidden h-1 w-24 overflow-hidden rounded-full bg-muted xl:block">
            <div className="h-full w-3/5 rounded-full bg-secondary" />
          </div>
        </div>
        <Button className="rmr-label h-8 rounded" disabled={dashboardQuery.isFetching} onClick={handleSeedDemoData} variant="outline">
          Refresh
        </Button>
        <Button className="rmr-label h-8 rounded" disabled={!dashboard?.shipmentCount} onClick={handleDownloadPilotSummary} variant="outline">
          <FileText className="mr-2 size-4" />
          Summary
        </Button>
      </div>
    </div>
  );
}

function MiniContextMetric({ accent = false, label, value }: { accent?: boolean; label: string; value: string }) {
  return (
    <div className="grid gap-0.5">
      <span className="text-[9px] font-bold uppercase tracking-[0.05em] text-muted-foreground">{label}</span>
      <span className={accent ? "rmr-data text-secondary" : "rmr-data text-foreground"}>{value}</span>
    </div>
  );
}

function WorkbenchExceptionQueue({
  carrierFilter,
  carrierOptions,
  filteredExceptions,
  modeFilter,
  modeOptions,
  ownerFilter,
  queueSearch,
  refreshDashboard,
  riskFilter,
  selectedExceptionId,
  setCarrierFilter,
  setModeFilter,
  setOwnerFilter,
  setQueueSearch,
  setRiskFilter,
  setSelectedExceptionId,
  setStatusFilter,
  statusFilter,
}: any) {
  const queueRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!selectedExceptionId || !queueRef.current || !shouldRunMotion()) return;
    const selectedRow = queueRef.current.querySelector(`[data-exception-id="${selectedExceptionId}"]`);
    if (!selectedRow) return;

    const animation = animate(selectedRow, {
      scale: { from: 0.985, to: 1 },
      x: { from: -8, to: 0 },
      duration: 460,
      ease: "outCubic",
    });

    return () => {
      animation.cancel();
    };
  }, [selectedExceptionId]);

  return (
    <section className="flex min-h-0 w-full min-w-0 flex-col overflow-hidden border-r border-border/30 bg-background lg:w-[55%] xl:w-[60%]">
      <div className="grid grid-cols-1 gap-2 border-b border-border/30 bg-card-subtle/45 p-3 sm:hidden">
        <Input
          aria-label="Search exceptions"
          className="h-9"
          placeholder="Search customer, lane, carrier..."
          value={queueSearch}
          onChange={(event) => setQueueSearch(event.currentTarget.value)}
        />
        <NativeSelect label="Owner" value={ownerFilter} onChange={setOwnerFilter} options={["all", "unassigned", ...owners]} />
        <NativeSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={["all", "new", "approved", "deferred", "rejected"]} />
        <NativeSelect label="Risk" value={riskFilter} onChange={setRiskFilter} options={["all", "medium", "high", "critical"]} />
        <NativeSelect label="Mode" value={modeFilter} onChange={setModeFilter} options={modeOptions} />
        <NativeSelect label="Carrier" value={carrierFilter} onChange={setCarrierFilter} options={carrierOptions} />
      </div>
      <div className="hidden gap-2 border-b border-border/30 bg-card-subtle/45 px-[var(--rmr-page-pad)] py-2 sm:grid lg:grid-cols-[minmax(10rem,1.4fr)_repeat(5,minmax(6rem,0.7fr))]">
        <Input
          aria-label="Search exceptions"
          className="h-8 text-xs"
          placeholder="Search customer, shipment, lane, carrier..."
          value={queueSearch}
          onChange={(event) => setQueueSearch(event.currentTarget.value)}
        />
        <CompactSelect value={ownerFilter} onChange={setOwnerFilter} options={["all", "unassigned", ...owners]} />
        <CompactSelect value={statusFilter} onChange={setStatusFilter} options={["all", "new", "approved", "deferred", "rejected"]} />
        <CompactSelect value={riskFilter} onChange={setRiskFilter} options={["all", "medium", "high", "critical"]} />
        <CompactSelect value={modeFilter} onChange={setModeFilter} options={modeOptions} />
        <CompactSelect value={carrierFilter} onChange={setCarrierFilter} options={carrierOptions} />
      </div>
      <div className="hidden grid-cols-12 gap-2 border-b border-border/30 bg-card-subtle/45 px-[var(--rmr-page-pad)] py-2 text-[11px] font-bold uppercase tracking-[0.05em] text-muted-foreground sm:grid">
        <div className="col-span-3">Shipment / ID</div>
        <div className="col-span-2">Lane</div>
        <div className="col-span-3">Risk Factor</div>
        <div className="col-span-2 text-right">Value At Risk</div>
        <div className="col-span-2 text-center">Status</div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2 rmr-scrollbar" ref={queueRef}>
        {filteredExceptions.map((exception: any) => (
          <button
            className={
              selectedExceptionId === exception.id
                ? "relative mb-1 grid w-full grid-cols-1 items-start gap-3 rounded border border-secondary bg-primary/5 p-[var(--rmr-queue-row-pad)] text-left shadow-[0_0_15px_rgba(76,215,246,0.1)] sm:grid-cols-12 sm:items-center sm:gap-2"
                : "mb-1 grid w-full grid-cols-1 items-start gap-3 rounded border border-border/20 bg-card p-[var(--rmr-queue-row-pad)] text-left transition-colors duration-300 ease-out hover:border-border/50 sm:grid-cols-12 sm:items-center sm:gap-2"
            }
            key={exception.id}
            onClick={() => setSelectedExceptionId(exception.id)}
            data-exception-id={exception.id}
            type="button"
          >
            {selectedExceptionId === exception.id ? <span className="absolute inset-y-0 left-0 w-0.5 bg-secondary" /> : null}
            <div className="min-w-0 sm:col-span-3">
              <span className="block truncate text-sm font-semibold">{exception.customer}</span>
              <span className="rmr-data block truncate text-[11px] text-muted-foreground">{exception.shipmentId}</span>
            </div>
            <div className="rmr-data min-w-0 sm:col-span-2">
              <span className="block truncate text-foreground">{exception.lane}</span>
              <span className="block truncate text-[10px] text-muted-foreground">{exception.priority}</span>
            </div>
            <div className="min-w-0 sm:col-span-3">
              <span className={exception.riskLevel === "critical" ? "block truncate text-sm font-medium text-destructive" : "block truncate text-sm font-medium text-foreground"}>
                {exception.reason}
              </span>
              <span className="rmr-label block truncate text-[9px] text-muted-foreground">
                {exception.owner || "Unassigned"}
              </span>
            </div>
            <div className="rmr-data text-left sm:col-span-2 sm:text-right">{currencyFormatter.format(exception.value || 0)}</div>
            <div className="flex justify-start sm:col-span-2 sm:justify-center">
              <RiskBadge level={exception.riskLevel} score={exception.riskScore} />
            </div>
          </button>
        ))}
        {!filteredExceptions.length ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No exceptions match the current filters.</div>
        ) : null}
      </div>
    </section>
  );
}

function WorkbenchDetailPanel({
  activeShipment,
  decisionError,
  decisionNote,
  handleDecision,
  handleDecisionOutcome,
  latestDecision,
  recommendation,
  selectedAction,
  selectedException,
  setDecisionNote,
  setSelectedScenarioAction,
}: any) {
  const detailRef = useRef<HTMLElement | null>(null);
  const scenarioRef = useRef<HTMLDivElement | null>(null);
  const [outcomeStatus, setOutcomeStatus] = useState<"pending" | "monitoring" | "successful" | "failed">("pending");
  const [outcomeNote, setOutcomeNote] = useState("");
  const [outcomeMessage, setOutcomeMessage] = useState("");

  useEffect(() => {
    setOutcomeStatus(latestDecision?.outcomeStatus || "pending");
    setOutcomeNote(latestDecision?.outcomeNote || "");
    setOutcomeMessage("");
  }, [latestDecision?.id, latestDecision?.outcomeStatus, latestDecision?.outcomeNote]);

  useEffect(() => {
    if (!selectedException?.id || !detailRef.current || !shouldRunMotion()) return;
    const elements = detailRef.current.querySelectorAll("[data-rmr-detail-animate]");
    if (!elements.length) return;

    const animation = animate(elements, {
      opacity: { from: 0, to: 1 },
      y: { from: 10, to: 0 },
      duration: 520,
      delay: (_target: Element, index: number) => index * 55,
      ease: "outCubic",
    });

    return () => {
      animation.cancel();
    };
  }, [selectedException?.id]);

  useEffect(() => {
    if (!selectedAction || !scenarioRef.current || !shouldRunMotion()) return;
    const selectedScenario = scenarioRef.current.querySelector(`[data-scenario-action="${selectedAction}"]`);
    if (!selectedScenario) return;

    const animation = animate(selectedScenario, {
      scale: { from: 0.975, to: 1 },
      x: { from: 10, to: 0 },
      duration: 460,
      ease: "outCubic",
    });

    return () => {
      animation.cancel();
    };
  }, [selectedAction]);

  return (
    <aside className="relative flex min-h-0 w-full min-w-0 flex-col gap-[var(--rmr-detail-gap)] overflow-y-auto bg-card-subtle/80 p-[var(--rmr-page-pad)] rmr-scrollbar dark:bg-[#010f1f] lg:w-[45%] xl:w-[40%]" ref={detailRef}>
      <div className="pointer-events-none absolute right-0 top-0 size-64 rounded-full bg-secondary/5 blur-[80px]" />
      {selectedException && activeShipment ? (
        <>
          <div className="flex items-start justify-between gap-4" data-rmr-detail-animate>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h2 className="m-0 truncate text-2xl font-semibold">{selectedException.shipmentId}</h2>
                <RiskBadge level={selectedException.riskLevel} score={selectedException.riskScore} />
              </div>
              <p className="text-sm text-muted-foreground">
                {activeShipment.customer} · {activeShipment.mode} · Carrier: {activeShipment.carrier}
              </p>
            </div>
          </div>

          <div className="rmr-stream min-h-[5.75rem] overflow-hidden rounded border border-border/40 bg-card-subtle/70 p-[var(--rmr-panel-pad)]" data-rmr-detail-animate>
            <div className="grid h-full min-h-[4.25rem] grid-cols-[minmax(0,1fr)_minmax(6.5rem,1.05fr)_minmax(0,1fr)] items-center gap-3">
              <RouteStop label="Origin" code={activeShipment.origin} />
              <div className="flex min-w-0 flex-col items-center justify-center gap-2 px-1">
                <div className="relative h-px w-full min-w-0 border-t border-dashed border-border/70">
                  <Truck className="absolute left-1/2 top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border/50 bg-background p-1 text-secondary dark:bg-card-subtle" />
                </div>
                <span className="rmr-label max-w-full truncate text-center text-muted-foreground">ETA {activeShipment.eta}</span>
              </div>
              <RouteStop alignRight label="Destination" code={activeShipment.destination} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-[var(--rmr-detail-gap)] sm:grid-cols-2" data-rmr-detail-animate>
            <DetailBlock danger label="Risk Factor" value={selectedException.reason} detail={selectedException.lane} />
            <DetailBlock label="Value at Risk" value={currencyFormatter.format(activeShipment.value)} detail={`${activeShipment.priority} priority shipment`} />
          </div>

          <div className="mt-1 flex flex-1 flex-col gap-2" data-rmr-detail-animate ref={scenarioRef}>
            <div className="rmr-label flex items-center gap-2 text-secondary">
              <CheckCircle2 className="size-[18px]" /> AI Scenario Engine
            </div>
            {recommendation?.scenarios.map((scenario: any) => (
              <button
                className={
                  scenario.action === selectedAction
                    ? "relative overflow-hidden rounded border border-secondary bg-primary/5 p-[var(--rmr-scenario-pad)] pl-5 text-left shadow-[0_0_15px_rgba(76,215,246,0.1)]"
                    : "rounded border border-border/30 bg-card p-[var(--rmr-scenario-pad)] text-left transition-colors duration-300 ease-out hover:border-border/60"
                }
                key={scenario.action}
                onClick={() => setSelectedScenarioAction(scenario.action)}
                data-scenario-action={scenario.action}
                type="button"
              >
                {scenario.action === selectedAction ? (
                  <span className="absolute inset-y-0 left-0 w-[3px] bg-secondary rmr-glow" />
                ) : null}
                {scenario.recommended ? (
                  <span className="rmr-label absolute right-3 top-3 rounded bg-secondary px-2 py-0.5 text-[9px] text-secondary-foreground">Recommended</span>
                ) : null}
                <div className="text-sm font-semibold text-foreground">
                  {scenario.label}
                </div>
                <div className="mt-2 flex flex-wrap gap-5 rmr-data">
                  <span className="text-destructive">Cost: {scenario.costBand}</span>
                  <span className="text-secondary">ETA: {scenario.etaImpact}</span>
                </div>
                <p className="mt-3 border-t border-border/30 pt-3 text-xs leading-5 text-muted-foreground">
                  {scenario.rationale}
                </p>
              </button>
            ))}
          </div>

          <div className="mt-auto grid gap-2 border-t border-border/30 pt-4" data-rmr-detail-animate>
            <Label className="rmr-label text-muted-foreground">Decision note</Label>
            <Textarea className="min-h-16" value={decisionNote} onChange={(event) => setDecisionNote(event.currentTarget.value)} placeholder="Add the operational reason for the decision." />
            {decisionError ? <p className="text-sm font-semibold text-destructive">{decisionError}</p> : null}
          </div>

          {latestDecision ? (
            <div className="grid gap-2 rounded border border-border/40 bg-background/60 p-[var(--rmr-panel-pad)]" data-rmr-detail-animate>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="rmr-label flex items-center gap-2 text-muted-foreground">
                    Decision outcome
                    {latestDecision.recommendationSource === "llm-dummy" || latestDecision.recommendationSource === "llm-openai" ? (
                      <span className="rmr-label rounded bg-secondary/15 px-2 py-0.5 text-secondary">
                        AI · {latestDecision.recommendationSource === "llm-dummy" ? "Dummy" : "OpenAI"}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Track whether the approved response worked during pilot review.
                  </p>
                </div>
                <select
                  className="h-9 rounded border border-input bg-background px-2 text-xs text-foreground"
                  value={outcomeStatus}
                  onChange={(event) => setOutcomeStatus(event.currentTarget.value as "pending" | "monitoring" | "successful" | "failed")}
                >
                  <option value="pending">Pending</option>
                  <option value="monitoring">Monitoring</option>
                  <option value="successful">Successful</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <Textarea
                className="min-h-14"
                value={outcomeNote}
                onChange={(event) => setOutcomeNote(event.currentTarget.value)}
                placeholder="Add actual result, customer impact, or follow-up notes."
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  className="rmr-label h-8 rounded"
                  onClick={async () => {
                    await handleDecisionOutcome({
                      decisionId: latestDecision.id,
                      outcomeNote,
                      outcomeStatus,
                    });
                    setOutcomeMessage("Outcome saved.");
                  }}
                  type="button"
                  variant="outline"
                >
                  Save Outcome
                </Button>
                {outcomeMessage ? <span className="text-xs font-semibold text-secondary">{outcomeMessage}</span> : null}
              </div>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]" data-rmr-detail-animate>
            <Button className="rmr-label rounded bg-secondary text-secondary-foreground hover:bg-secondary-muted" onClick={() => handleDecision("approved")}>
              Execute Recommendation
            </Button>
            <Button className="rmr-label rounded" variant="outline" onClick={() => handleDecision("deferred")}>Defer</Button>
            <Button className="rmr-label size-10 rounded p-0" variant="destructive" onClick={() => handleDecision("rejected")} title="Reject AI suggestion">
              <X className="size-4" />
            </Button>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Select an exception to inspect risk and compare scenarios.</p>
      )}
    </aside>
  );
}

function RouteStop({ alignRight = false, code, label }: { alignRight?: boolean; code: string; label: string }) {
  return (
    <div className={alignRight ? "min-w-0 overflow-hidden text-right" : "min-w-0 overflow-hidden"}>
      <div className="rmr-label mb-1 truncate text-muted-foreground">{label}</div>
      <div className="rmr-data text-sm font-semibold leading-5 text-foreground [overflow-wrap:anywhere] xl:text-base">{code}</div>
    </div>
  );
}

function ImportErrorsTable({ errors }: { errors: ImportError[] }) {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
      <div className="border-b border-amber-200 px-3 py-2 text-sm font-semibold dark:border-amber-900">
        Import issues to fix
      </div>
      <div className="max-w-full overflow-hidden">
        <table className="w-full table-fixed text-left text-xs sm:text-sm">
          <thead className="border-b border-amber-200 text-xs uppercase text-amber-800 dark:border-amber-900 dark:text-amber-200">
            <tr>
              <th className="w-[16%] py-3 pl-2 pr-2 sm:pl-3">Row</th>
              <th className="w-[24%] py-3 pr-2">Shipment</th>
              <th className="w-[60%] py-3 pr-2">Issue</th>
            </tr>
          </thead>
          <tbody>
            {errors.map((error, index) => (
              <tr className="border-b border-amber-200 last:border-b-0 dark:border-amber-900" key={`${error.rowNumber}-${error.shipmentId}-${index}`}>
                <td className="py-3 pl-2 pr-2 align-top [overflow-wrap:anywhere] sm:pl-3">{error.rowNumber}</td>
                <td className="py-3 pr-2 align-top [overflow-wrap:anywhere]">{error.shipmentId}</td>
                <td className="py-3 pr-2 align-top [overflow-wrap:anywhere]">{error.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DetailBlock({ danger = false, detail, label, value }: { danger?: boolean; detail: string; label: string; value: string }) {
  return (
    <div className={danger ? "min-w-0 rounded border border-destructive/40 border-t-2 border-t-destructive bg-card-subtle/70 p-[var(--rmr-panel-pad)] text-card-subtle-foreground shadow-[0_4px_24px_rgba(255,180,171,0.05)]" : "min-w-0 rounded border border-border/40 bg-card-subtle/70 p-[var(--rmr-panel-pad)] text-card-subtle-foreground"}>
      <div className={danger ? "rmr-label text-destructive" : "rmr-label text-muted-foreground"}>{label}</div>
      <strong className="mt-2 block break-words text-sm">{value}</strong>
      <p className="mt-2 break-words text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}

function NativeSelect({ label, onChange, options, value }: { label: string; onChange: (value: any) => void; options: string[]; value: string }) {
  return <label className="grid min-w-0 gap-1 text-xs font-semibold text-muted-foreground">{label}<select className="h-9 min-w-0 rounded-md border border-input bg-background px-3 text-sm text-foreground" value={value} onChange={(event) => onChange(event.currentTarget.value)}>{options.map((option) => <option key={option} value={option}>{formatAction(option)}</option>)}</select></label>;
}

function CompactSelect({ onChange, options, value }: { onChange: (value: string) => void; options: string[]; value: string }) {
  return (
    <select
      className="h-8 min-w-0 rounded border border-input bg-background px-2 text-xs text-foreground"
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
    >
      {options.map((option) => (
        <option key={option} value={option}>{formatAction(option)}</option>
      ))}
    </select>
  );
}

function RiskBadge({ level, score }: { level: RiskLevel | DisruptionSeverity; score?: number }) {
  const className = level === "critical" ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200" : level === "high" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200" : level === "medium" ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200" : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100";
  return <span className={`inline-flex max-w-full rounded-full px-2 py-1 text-xs font-semibold leading-tight [overflow-wrap:anywhere] ${className}`}>{level}{typeof score === "number" ? ` ${score}/100` : ""}</span>;
}

function downloadCsv(fileName: string, rows: Array<readonly (string | number)[]>) {
  const csv = rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCsvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function formatAction(value: string) {
  return value.split("-").join(" ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatHours(value: number) {
  if (!value) return "-";
  if (value < 24) return `${value}h`;
  return `${Math.round(value / 24)}d`;
}
