import { animate } from "animejs/animation";
import { Link as ReactRouterLink } from "react-router";
import { routes } from "wasp/client/router";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Database,
  FileText,
  History,
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
  type FormEvent,
  type ReactNode,
} from "react";
import {
  assignRMRoadsExceptionOwner,
  decideRMRoadsException,
  getRMRoadsDashboard,
  importRMRoadsShipmentCsv,
  seedRMRoadsDemoData,
  updateRMRoadsAlertSettings,
  useQuery,
} from "wasp/client/operations";
import { Button } from "../client/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../client/components/ui/card";
import { Input } from "../client/components/ui/input";
import { Label } from "../client/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../client/components/ui/select";
import { Textarea } from "../client/components/ui/textarea";
import { requiredShipmentCsvFields, type ImportError } from "./domain/csv";
import { generateRecommendation } from "./domain/recommendations";
import type {
  DisruptionSeverity,
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

export default function RMRoadsDashboardPage() {
  const [importMessage, setImportMessage] = useState("");
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [alertSettingsMessage, setAlertSettingsMessage] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [selectedExceptionId, setSelectedExceptionId] = useState("");
  const [selectedScenarioAction, setSelectedScenarioAction] = useState<ScenarioAction | "">("");
  const [decisionNote, setDecisionNote] = useState("");
  const [decisionError, setDecisionError] = useState("");
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
  const selectedAction =
    selectedScenarioAction || selectedException?.selectedScenarioAction || recommendation?.primaryAction || "watch";

  const filteredExceptions = exceptions.filter((exception) => {
    const ownerMatch =
      ownerFilter === "all" ||
      (ownerFilter === "unassigned" && !exception.owner) ||
      exception.owner === ownerFilter;
    const statusMatch = statusFilter === "all" || exception.status === statusFilter;
    const riskMatch = riskFilter === "all" || exception.riskLevel === riskFilter;
    return ownerMatch && statusMatch && riskMatch;
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

  const handleAlertSettingsSubmit = async (settings: {
    alertEmailsEnabled: boolean;
    alertRecipients: string;
  }) => {
    try {
      await updateRMRoadsAlertSettings(settings);
      setAlertSettingsMessage("Alert settings saved.");
      await refreshDashboard();
    } catch (error: any) {
      setAlertSettingsMessage(error.message || "Could not save alert settings.");
    }
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
        />

        <section className="flex h-full min-w-0 flex-1 flex-col bg-background">
          <WorkbenchContextBar
            dashboard={dashboard}
            dashboardQuery={dashboardQuery}
            exceptions={exceptions}
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
              ownerFilter={ownerFilter}
              refreshDashboard={refreshDashboard}
              riskFilter={riskFilter}
              selectedExceptionId={selectedException?.id || ""}
              setOwnerFilter={setOwnerFilter}
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
              recommendation={recommendation}
              selectedAction={selectedAction}
              selectedException={selectedException}
              setDecisionNote={setDecisionNote}
              setSelectedScenarioAction={setSelectedScenarioAction}
            />
          </div>

          <div className="hidden gap-4 border-t border-border/30 bg-background/80 p-4">
            <AlertSettingsCard
              message={alertSettingsMessage}
              onSubmit={handleAlertSettingsSubmit}
              organization={dashboard?.organization}
            />
            <ImportHistoryCard importHistory={dashboard?.importHistory || []} />
            <AlertLogCard alerts={dashboard?.alerts || []} />
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
}: any) {
  return (
    <aside className="hidden w-16 shrink-0 flex-col border-r border-border/30 bg-card-subtle transition-all duration-300 dark:bg-[#010f1f] md:flex lg:w-[var(--rmr-rail-width)]">
      <div className="hidden border-b border-border/30 p-[var(--rmr-panel-pad)] lg:block">
        <div className="rmr-label mb-1 flex items-center gap-2 text-secondary">
          <span className="size-2 rounded-full bg-secondary rmr-glow" />
          OPS CENTER
        </div>
        <div className="rmr-data text-muted-foreground">
          Active nodes: {dashboard?.shipmentCount || 0}
        </div>
      </div>
      <div className="flex justify-center border-b border-border/30 p-3 lg:hidden">
        <span className="mt-1 size-2 rounded-full bg-secondary rmr-glow" />
      </div>

      <div className="grid gap-2 border-b border-border/30 p-2 lg:p-[var(--rmr-panel-pad)]">
        <Button className="rmr-label justify-center rounded border-border/50 bg-card-subtle px-2 text-foreground hover:border-secondary hover:bg-muted lg:justify-start" onClick={handleSeedDemoData}>
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

      <nav className="flex-1 overflow-y-auto py-2 rmr-scrollbar">
        <WorkbenchRailItem active icon={<AlertTriangle className="size-5" />} label="Disruptions" />
        <WorkbenchRailItem icon={<RouteIcon />} label="Route Opti" />
        <WorkbenchRailItem icon={<Database className="size-5" />} label="Asset Sync" />
        <WorkbenchRailItem icon={<ClipboardList className="size-5" />} label="Scenario Lab" />
        <WorkbenchRailItem icon={<History className="size-5" />} label="Audit Log" />
      </nav>

      <div className="border-t border-border/30 py-2">
        <WorkbenchRailItem href={routes.RMRoadsSettingsRoute.to} icon={<Settings className="size-5" />} label="Settings" />
        <WorkbenchRailItem icon={<FileText className="size-5" />} label="Docs" />
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

  return href ? (
    <ReactRouterLink className={className} to={href}>
      {content}
    </ReactRouterLink>
  ) : (
    <button className={className} type="button">
      {content}
    </button>
  );
}

function RouteIcon() {
  return <Truck className="size-5" />;
}

function WorkbenchContextBar({ dashboard, dashboardQuery, exceptions, handleSeedDemoData }: any) {
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
          <MiniContextMetric label="Value Protected" value={currencyFormatter.format(dashboard?.estimatedProtectedValue || 0)} accent />
          <div className="h-1 w-32 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-3/5 rounded-full bg-secondary" />
          </div>
        </div>
        <Button className="rmr-label h-8 rounded" disabled={dashboardQuery.isFetching} onClick={handleSeedDemoData} variant="outline">
          Refresh
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
  filteredExceptions,
  ownerFilter,
  refreshDashboard,
  riskFilter,
  selectedExceptionId,
  setOwnerFilter,
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
        <NativeSelect label="Owner" value={ownerFilter} onChange={setOwnerFilter} options={["all", "unassigned", ...owners]} />
        <NativeSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={["all", "new", "approved", "deferred", "rejected"]} />
        <NativeSelect label="Risk" value={riskFilter} onChange={setRiskFilter} options={["all", "medium", "high", "critical"]} />
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
  recommendation,
  selectedAction,
  selectedException,
  setDecisionNote,
  setSelectedScenarioAction,
}: any) {
  const detailRef = useRef<HTMLElement | null>(null);
  const scenarioRef = useRef<HTMLDivElement | null>(null);

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
            <Button className="size-8 rounded p-0" type="button" variant="outline">
              <FileText className="size-4" />
            </Button>
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

function AlertSettingsCard({ message, onSubmit, organization }: any) {
  const [enabled, setEnabled] = useState(Boolean(organization?.alertEmailsEnabled));
  const [recipients, setRecipients] = useState((organization?.alertRecipients || []).join(", "));

  useEffect(() => {
    setEnabled(Boolean(organization?.alertEmailsEnabled));
    setRecipients((organization?.alertRecipients || []).join(", "));
  }, [organization?.alertEmailsEnabled, organization?.alertRecipients]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit({
      alertEmailsEnabled: enabled,
      alertRecipients: recipients,
    });
  };

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader><CardTitle>Critical Alert Settings</CardTitle></CardHeader>
      <CardContent className="min-w-0">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="flex items-start gap-3 rounded-md border border-border bg-card-subtle p-3 text-card-subtle-foreground">
            <input
              checked={enabled}
              className="mt-1 h-4 w-4 rounded border-input"
              onChange={(event) => setEnabled(event.currentTarget.checked)}
              type="checkbox"
            />
            <span className="min-w-0">
              <span className="block text-sm font-semibold">Email critical exceptions</span>
              <span className="mt-1 block text-sm text-muted-foreground">
                Send once when a new unchanged critical exception is created.
              </span>
            </span>
          </label>
          <div className="grid gap-2">
            <Label>Recipients</Label>
            <Textarea
              className="min-h-24"
              onChange={(event) => setRecipients(event.currentTarget.value)}
              placeholder="planner@example.com, ops@example.com"
              value={recipients}
            />
          </div>
          {message ? <p className="break-words text-sm font-semibold text-emerald-700 dark:text-emerald-300">{message}</p> : null}
          <Button type="submit">Save Alert Settings</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ImportHistoryCard({ importHistory }: any) {
  return <SimpleTableCard title="Import History" empty="No imports yet." headers={["Imported", "Source", "Accepted", "Rejected", "Duplicates"]} rows={importHistory.map((entry: any) => [formatDateTime(entry.importedAt), entry.sourceName, entry.acceptedCount, entry.rejectedCount, entry.duplicateCount])} />;
}

function AlertLogCard({ alerts }: any) {
  return <SimpleTableCard title="Critical Alert Log" empty="No critical alerts generated yet." headers={["Created", "Delivery", "Shipment", "Risk", "Message"]} rows={alerts.map((alert: any) => [formatDateTime(alert.createdAt), alert.sentAt ? `${alert.deliveryStatus} ${formatDateTime(alert.sentAt)}` : alert.deliveryStatus || "Pending", alert.shipmentId, `${alert.riskLevel} ${alert.riskScore}/100`, alert.message])} />;
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

function ListBlock({ items, label }: { items: string[]; label: string }) {
  return <div className="min-w-0 rounded-md border border-border bg-card-subtle p-4 text-card-subtle-foreground"><div className="text-muted-foreground text-xs font-semibold uppercase">{label}</div><ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-4 text-sm">{items.map((item) => <li className="break-words" key={item}>{item}</li>)}</ul></div>;
}

function OwnerSelect({ exception, refreshDashboard }: any) {
  return <Select value={exception.owner || "unassigned"} onValueChange={async (ownerName) => { await assignRMRoadsExceptionOwner({ exceptionId: exception.id, ownerName: ownerName === "unassigned" ? "" : ownerName }); await refreshDashboard(); }}><SelectTrigger className="h-auto min-h-9 w-full min-w-0 px-2 text-xs sm:text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unassigned">Unassigned</SelectItem>{owners.map((owner) => <SelectItem key={owner} value={owner}>{owner}</SelectItem>)}</SelectContent></Select>;
}

function NativeSelect({ label, onChange, options, value }: { label: string; onChange: (value: any) => void; options: string[]; value: string }) {
  return <label className="grid min-w-0 gap-1 text-xs font-semibold text-muted-foreground">{label}<select className="h-9 min-w-0 rounded-md border border-input bg-background px-3 text-sm text-foreground" value={value} onChange={(event) => onChange(event.currentTarget.value)}>{options.map((option) => <option key={option} value={option}>{formatAction(option)}</option>)}</select></label>;
}

function RiskBadge({ level, score }: { level: RiskLevel | DisruptionSeverity; score?: number }) {
  const className = level === "critical" ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200" : level === "high" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200" : level === "medium" ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200" : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100";
  return <span className={`inline-flex max-w-full rounded-full px-2 py-1 text-xs font-semibold leading-tight [overflow-wrap:anywhere] ${className}`}>{level}{typeof score === "number" ? ` ${score}/100` : ""}</span>;
}

function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return <tr><td className="py-8 text-center text-sm text-muted-foreground" colSpan={colSpan}>{message}</td></tr>;
}

function SimpleTableCard({ empty, headers, rows, title }: { empty: string; headers: string[]; rows: Array<Array<string | number>>; title: string }) {
  return <Card className="min-w-0 overflow-hidden"><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent className="min-w-0"><div className="max-w-full overflow-hidden rounded-md border border-border"><table className="w-full table-fixed text-left text-xs sm:text-sm"><thead className="text-muted-foreground border-b text-xs uppercase"><tr>{headers.map((header, index) => <th className={index === 0 ? "py-3 pl-2 pr-2 sm:pl-3" : "py-3 pr-2"} key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr className="border-b last:border-b-0" key={`${title}-${index}`}>{row.map((cell, cellIndex) => <td className={cellIndex === 0 ? "py-4 pl-2 pr-2 align-top [overflow-wrap:anywhere] sm:pl-3" : "py-4 pr-2 align-top [overflow-wrap:anywhere]"} key={`${title}-${index}-${cellIndex}`}>{cell}</td>)}</tr>)}{!rows.length ? <EmptyRow colSpan={headers.length} message={empty} /> : null}</tbody></table></div></CardContent></Card>;
}

function downloadCsv(fileName: string, rows: Array<readonly string[]>) {
  const csv = rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCsvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function formatAction(value: string) {
  return value.split("-").join(" ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDateTime(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}
