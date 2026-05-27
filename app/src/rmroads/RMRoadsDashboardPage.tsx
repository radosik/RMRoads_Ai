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
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
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
import { useToast } from "../client/hooks/use-toast";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const ownerFilter = searchParams.get("owner") || "all";
  const statusFilter = searchParams.get("status") || "all";
  const riskFilter = searchParams.get("risk") || "all";
  const carrierFilter = searchParams.get("carrier") || "all";
  const modeFilter = searchParams.get("mode") || "all";
  const queueSearch = searchParams.get("q") || "";
  const updateFilterParam = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (!value || value === "all") next.delete(key);
      else next.set(key, value);
      return next;
    }, { replace: true });
  };
  const setOwnerFilter = (v: string) => updateFilterParam("owner", v);
  const setStatusFilter = (v: string) => updateFilterParam("status", v);
  const setRiskFilter = (v: string) => updateFilterParam("risk", v);
  const setCarrierFilter = (v: string) => updateFilterParam("carrier", v);
  const setModeFilter = (v: string) => updateFilterParam("mode", v);
  const setQueueSearch = (v: string) => updateFilterParam("q", v);
  const [selectedExceptionId, setSelectedExceptionId] = useState("");
  const [selectedScenarioAction, setSelectedScenarioAction] = useState<ScenarioAction | "">("");
  const [decisionNote, setDecisionNote] = useState("");
  const [decisionError, setDecisionError] = useState("");
  const [signalForm, setSignalForm] = useState(defaultSignalForm);
  const [signalMessage, setSignalMessage] = useState("");
  const { toast } = useToast();
  const { t } = useTranslation();
  // Poll every 30s so a planner sees decisions made by teammates without
  // a manual refresh. The Refresh button in the context bar still works
  // for ad-hoc reloads.
  const dashboardQuery = useQuery(getRMRoadsDashboard, undefined, {
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
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
    try {
      await seedRMRoadsDemoData();
      setImportMessage("");
      setImportErrors([]);
      await refreshDashboard();
      toast({ title: t("dashboard.toasts.demoLoaded.title"), description: t("dashboard.toasts.demoLoaded.description") });
    } catch (error) {
      toast({
        title: t("dashboard.toasts.demoFailed.title"),
        description: error instanceof Error ? error.message : t("dashboard.toasts.unknownError"),
        variant: "destructive",
      });
    }
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
        t("dashboard.import.summary", {
          accepted: result.acceptedCount,
          rejected: result.rejectedCount,
          duplicates: result.duplicateCount,
        }),
      );
      setImportErrors(result.errors);
      setSelectedExceptionId("");
      await refreshDashboard();
    } catch (error: any) {
      setImportMessage(error.message || t("dashboard.import.failed"));
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
      setSignalMessage(t("dashboard.signal.saved"));
      await refreshDashboard();
    } catch (error: any) {
      setSignalMessage(error.message || t("dashboard.signal.saveFailed"));
    }
  };

  const handleToggleSignal = async (id: string) => {
    await toggleRMRoadsDisruptionEventStatus({ id });
    await refreshDashboard();
  };

  const handleDecision = async (status: "approved" | "deferred" | "rejected") => {
    if (!selectedException) return;
    if ((status === "deferred" || status === "rejected") && !decisionNote.trim()) {
      setDecisionError(t("dashboard.decision.noteRequired"));
      return;
    }

    try {
      await decideRMRoadsException({
        exceptionId: selectedException.id,
        status,
        scenarioAction: selectedAction,
        note: decisionNote,
      });
      setDecisionError("");
      setDecisionNote("");
      await refreshDashboard();
      toast({
        title: `${t(`dashboard.decision.verbs.${status}`)} · ${selectedException.shipmentId}`,
        description: t("dashboard.decision.recorded", { action: t(`dashboard.scenarioActions.${selectedAction}`, { defaultValue: selectedAction }), customer: selectedException.customer }),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : t("dashboard.toasts.unknownError");
      setDecisionError(message);
      toast({ title: t("dashboard.decision.saveFailed"), description: message, variant: "destructive" });
    }
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
    try {
      await updateRMRoadsDecisionOutcome({
        decisionId,
        outcomeNote,
        outcomeStatus,
      });
      await refreshDashboard();
      toast({
        title: t("dashboard.outcome.savedToast"),
        description: t("dashboard.outcome.markedAs", { status: t(`dashboard.outcome.statuses.${outcomeStatus}`) }),
      });
    } catch (error) {
      toast({
        title: t("dashboard.outcome.saveFailed"),
        description: error instanceof Error ? error.message : t("dashboard.toasts.unknownError"),
        variant: "destructive",
      });
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
              {t("dashboard.loading")}
            </div>
          ) : null}

          {dashboardQuery.error ? (
            <div className="border-b border-destructive/40 bg-destructive/10 px-6 py-4 text-sm font-semibold text-destructive">
              {t("dashboard.loadError")}
            </div>
          ) : null}

          {!dashboardQuery.isLoading && shipments.length === 0 ? (
            <div className="m-4 rounded border border-secondary/40 bg-secondary/10 p-5">
              <h2 className="text-lg font-semibold">{t("dashboard.empty.title")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("dashboard.empty.body")}
              </p>
              <Button className="rmr-label mt-4 rounded bg-secondary text-secondary-foreground hover:bg-secondary-muted" onClick={handleSeedDemoData}>
                {t("dashboard.empty.loadDemo")}
              </Button>
            </div>
          ) : null}

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
            <WorkbenchExceptionQueue
              filteredExceptions={filteredExceptions}
              hasShipments={Boolean(dashboard?.shipmentCount)}
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
  const { t } = useTranslation();
  const activeSignals = (dashboard?.disruptionEvents || []).filter((event: DisruptionEvent) => event.status === "active");
  return (
    <aside className="hidden w-16 shrink-0 flex-col border-r border-border/30 bg-card-subtle transition-all duration-300 dark:bg-[#010f1f] md:flex lg:w-[var(--rmr-rail-width)]">
      <div className="hidden border-b border-border/30 p-[var(--rmr-panel-pad)] lg:block">
        <div className="rmr-label mb-1 flex items-center gap-2 text-secondary">
          <span className="size-2 rounded-full bg-secondary rmr-glow" />
          {t("dashboard.sideRail.opsCenter")}
        </div>
        <div className="rmr-data text-muted-foreground" data-testid="rmroads-shipment-count">
          {t("dashboard.sideRail.activeNodes", { count: dashboard?.shipmentCount || 0 })}
        </div>
      </div>
      <div className="flex justify-center border-b border-border/30 p-3 lg:hidden">
        <span className="mt-1 size-2 rounded-full bg-secondary rmr-glow" />
      </div>

      <div className="grid gap-2 border-b border-border/30 p-2 lg:p-[var(--rmr-panel-pad)]">
        <Button className="rmr-label justify-center rounded border-border/50 bg-card-subtle px-2 text-foreground hover:border-secondary hover:bg-muted lg:justify-start" data-testid="rmroads-seed-data-button" onClick={handleSeedDemoData}>
          <Plus className="size-4 lg:mr-2" />
          <span className="hidden lg:inline">{dashboard?.shipmentCount ? t("dashboard.sideRail.refreshSim") : t("dashboard.sideRail.newSim")}</span>
        </Button>
        <Button className="rmr-label justify-center rounded px-2 lg:justify-start" onClick={handleDownloadTemplate} type="button" variant="outline">
          <FileText className="size-4 lg:mr-2" />
          <span className="hidden lg:inline">{t("dashboard.sideRail.csvTemplate")}</span>
        </Button>
        <label className="rmr-label flex h-9 cursor-pointer items-center justify-center rounded border border-border/50 bg-background/70 px-2 text-muted-foreground transition-colors hover:border-secondary hover:text-secondary lg:justify-start lg:px-3">
          <Database className="size-4 lg:mr-2" />
          <span className="hidden lg:inline">{t("dashboard.sideRail.importShipments")}</span>
          <Input className="sr-only" accept=".csv,text/csv" disabled={isImporting} onChange={handleCsvImport} type="file" />
        </label>
        {importMessage ? <p className="hidden text-xs leading-5 text-secondary lg:block">{importMessage}</p> : null}
        {importErrors.length ? <div className="hidden lg:block"><ImportErrorsTable errors={importErrors} /></div> : null}
      </div>

      <div className="hidden min-h-0 border-b border-border/30 p-[var(--rmr-panel-pad)] lg:grid lg:max-h-[46vh] lg:gap-3 lg:overflow-y-auto rmr-scrollbar">
        <div>
          <div className="rmr-label text-secondary">{t("dashboard.signal.title")}</div>
          <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
            {t("dashboard.signal.help")}
          </p>
        </div>
        <Input
          aria-label={t("dashboard.signal.typeLabel")}
          className="h-8 text-xs"
          placeholder={t("dashboard.signal.typeLabel")}
          value={signalForm.type}
          onChange={(event) => { const value = event.currentTarget.value; onSignalChange((current: typeof defaultSignalForm) => ({ ...current, type: value })); }}
        />
        <Input
          aria-label={t("dashboard.signal.affected")}
          className="h-8 text-xs"
          placeholder={t("dashboard.signal.affected")}
          value={signalForm.affectedText}
          onChange={(event) => { const value = event.currentTarget.value; onSignalChange((current: typeof defaultSignalForm) => ({ ...current, affectedText: value })); }}
        />
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-[minmax(0,1fr)_5.25rem]">
          <NativeSelect
            label={t("dashboard.signal.severity")}
            value={signalForm.severity}
            onChange={(severity) => onSignalChange((current: typeof defaultSignalForm) => ({ ...current, severity }))}
            options={["low", "medium", "high", "critical"]}
          />
          <Input
            aria-label={t("dashboard.signal.confidence")}
            className="h-9 text-xs"
            min={1}
            max={100}
            type="number"
            value={signalForm.confidence}
            onChange={(event) => { const value = event.currentTarget.value; onSignalChange((current: typeof defaultSignalForm) => ({ ...current, confidence: Number(value) || 1 })); }}
          />
        </div>
        <div className="grid gap-2">
          <label className="grid min-w-0 gap-1 text-xs font-semibold text-muted-foreground">
            {t("dashboard.signal.starts")}
            <Input
              aria-label={t("dashboard.signal.starts")}
              className="h-8 min-w-0 text-xs"
              type="date"
              value={signalForm.startsAt}
              onChange={(event) => { const value = event.currentTarget.value; onSignalChange((current: typeof defaultSignalForm) => ({ ...current, startsAt: value })); }}
            />
          </label>
          <label className="grid min-w-0 gap-1 text-xs font-semibold text-muted-foreground">
            {t("dashboard.signal.expires")}
            <Input
              aria-label={t("dashboard.signal.expires")}
              className="h-8 min-w-0 text-xs"
              type="date"
              value={signalForm.expiresAt}
              onChange={(event) => { const value = event.currentTarget.value; onSignalChange((current: typeof defaultSignalForm) => ({ ...current, expiresAt: value })); }}
            />
          </label>
        </div>
        <Button className="rmr-label h-8 rounded bg-secondary text-secondary-foreground hover:bg-secondary-muted" onClick={onSignalSubmit} type="button">
          {t("dashboard.signal.add")}
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
                    {event.startsAt || t("dashboard.signal.now")} - {event.expiresAt || t("dashboard.signal.open")}
                  </div>
                </div>
                <button className="rmr-label justify-self-start text-[10px] text-muted-foreground hover:text-destructive" onClick={() => onToggleSignal(event.id)} type="button">
                  {t("dashboard.signal.archive")}
                </button>
              </div>
            </div>
          ))}
          {!activeSignals.length ? <p className="text-xs text-muted-foreground">{t("dashboard.signal.none")}</p> : null}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 rmr-scrollbar">
        <WorkbenchRailItem active icon={<AlertTriangle className="size-5" />} label={t("dashboard.sideRail.disruptions")} />
      </nav>

      <div className="border-t border-border/30 py-2">
        <WorkbenchRailItem href={routes.RMRoadsSettingsRoute.to} icon={<Settings className="size-5" />} label={t("dashboard.sideRail.settings")} />
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
  const { t } = useTranslation();
  const criticalCount = exceptions.filter((exception: any) => exception.riskLevel === "critical").length;
  const actionableCount = exceptions.filter((exception: any) => exception.status === "new" || exception.status === "deferred").length;

  return (
    <div className="flex min-h-[var(--rmr-context-height)] shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border/30 bg-card-subtle/85 px-[var(--rmr-page-pad)] py-1.5 backdrop-blur dark:bg-[#010f1f]/70">
      <div className="flex min-w-0 flex-wrap items-center gap-4">
        <h1 className="text-lg font-semibold leading-none tracking-tight">{t("dashboard.contextBar.title")}</h1>
        <div className="hidden h-5 w-px bg-border/60 sm:block" />
        <div className="rmr-data flex flex-wrap items-center gap-4 leading-none">
          <span className="flex items-center gap-2 text-destructive">
            <span className="size-2 rounded-full bg-destructive" /> {t("dashboard.contextBar.critical", { count: criticalCount })}
          </span>
          <span className="flex items-center gap-2 text-secondary">
            <span className="size-2 rounded-full bg-secondary" /> {t("dashboard.contextBar.actionable", { count: actionableCount })}
          </span>
          <span className="text-muted-foreground">{t("dashboard.contextBar.activeSignals", { count: dashboard?.eventCount || 0 })}</span>
        </div>
      </div>
      <div className="hidden items-center gap-3 lg:flex">
        <div className="flex items-center gap-5 rounded border border-border/40 bg-card-subtle/60 px-4 py-1">
          <MiniContextMetric label={t("dashboard.contextBar.metrics.decisions")} value={`${dashboard?.reviewedCount || 0}`} />
          <div className="h-7 w-px bg-border/50" />
          <MiniContextMetric label={t("dashboard.contextBar.metrics.avgResponse")} value={formatHours(dashboard?.averageResponseHours || 0)} />
          <div className="h-7 w-px bg-border/50" />
          <MiniContextMetric label={t("dashboard.contextBar.metrics.valueProtected")} value={currencyFormatter.format(dashboard?.estimatedProtectedValue || 0)} accent />
          <div className="hidden h-1 w-24 overflow-hidden rounded-full bg-muted xl:block">
            <div className="h-full w-3/5 rounded-full bg-secondary" />
          </div>
        </div>
        <Button className="rmr-label h-8 rounded" disabled={dashboardQuery.isFetching} onClick={handleSeedDemoData} variant="outline">
          {t("dashboard.contextBar.refresh")}
        </Button>
        <Button className="rmr-label h-8 rounded" disabled={!dashboard?.shipmentCount} onClick={handleDownloadPilotSummary} variant="outline">
          <FileText className="mr-2 size-4" />
          {t("dashboard.contextBar.summary")}
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
  hasShipments,
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
  const { t } = useTranslation();

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
          aria-label={t("dashboard.queue.searchAria")}
          className="h-9"
          placeholder={t("dashboard.queue.searchPlaceholderShort")}
          value={queueSearch}
          onChange={(event) => setQueueSearch(event.currentTarget.value)}
        />
        <NativeSelect label={t("dashboard.queue.filters.owner")} value={ownerFilter} onChange={setOwnerFilter} options={["all", "unassigned", ...owners]} />
        <NativeSelect label={t("dashboard.queue.filters.status")} value={statusFilter} onChange={setStatusFilter} options={["all", "new", "approved", "deferred", "rejected"]} />
        <NativeSelect label={t("dashboard.queue.filters.risk")} value={riskFilter} onChange={setRiskFilter} options={["all", "medium", "high", "critical"]} />
        <NativeSelect label={t("dashboard.queue.filters.mode")} value={modeFilter} onChange={setModeFilter} options={modeOptions} />
        <NativeSelect label={t("dashboard.queue.filters.carrier")} value={carrierFilter} onChange={setCarrierFilter} options={carrierOptions} />
      </div>
      <div className="hidden gap-2 border-b border-border/30 bg-card-subtle/45 px-[var(--rmr-page-pad)] py-2 sm:grid lg:grid-cols-[minmax(10rem,1.4fr)_repeat(5,minmax(6rem,0.7fr))]">
        <Input
          aria-label={t("dashboard.queue.searchAria")}
          className="h-8 text-xs"
          placeholder={t("dashboard.queue.searchPlaceholderLong")}
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
        <div className="col-span-3">{t("dashboard.queue.cols.shipment")}</div>
        <div className="col-span-2">{t("dashboard.queue.cols.lane")}</div>
        <div className="col-span-3">{t("dashboard.queue.cols.riskFactor")}</div>
        <div className="col-span-2 text-right">{t("dashboard.queue.cols.valueAtRisk")}</div>
        <div className="col-span-2 text-center">{t("dashboard.queue.cols.status")}</div>
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
                {exception.owner || t("dashboard.queue.unassigned")}
              </span>
            </div>
            <div className="rmr-data text-left sm:col-span-2 sm:text-right">{currencyFormatter.format(exception.value || 0)}</div>
            <div className="flex justify-start sm:col-span-2 sm:justify-center">
              <RiskBadge level={exception.riskLevel} score={exception.riskScore} />
            </div>
          </button>
        ))}
        {!filteredExceptions.length ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {hasShipments
              ? t("dashboard.queue.noMatch")
              : t("dashboard.queue.noShipments")}
          </div>
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
  const { t } = useTranslation();
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
                {activeShipment.customer} · {activeShipment.mode} · {t("dashboard.detail.carrierPrefix")} {activeShipment.carrier}
              </p>
            </div>
          </div>

          <div className="rmr-stream min-h-[5.75rem] overflow-hidden rounded border border-border/40 bg-card-subtle/70 p-[var(--rmr-panel-pad)]" data-rmr-detail-animate>
            <div className="grid h-full min-h-[4.25rem] grid-cols-[minmax(0,1fr)_minmax(6.5rem,1.05fr)_minmax(0,1fr)] items-center gap-3">
              <RouteStop label={t("dashboard.detail.origin")} code={activeShipment.origin} />
              <div className="flex min-w-0 flex-col items-center justify-center gap-2 px-1">
                <div className="relative h-px w-full min-w-0 border-t border-dashed border-border/70">
                  <Truck className="absolute left-1/2 top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border/50 bg-background p-1 text-secondary dark:bg-card-subtle" />
                </div>
                <span className="rmr-label max-w-full truncate text-center text-muted-foreground">{t("dashboard.detail.eta")} {activeShipment.eta}</span>
              </div>
              <RouteStop alignRight label={t("dashboard.detail.destination")} code={activeShipment.destination} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-[var(--rmr-detail-gap)] sm:grid-cols-2" data-rmr-detail-animate>
            <DetailBlock danger label={t("dashboard.detail.riskFactor")} value={selectedException.reason} detail={selectedException.lane} />
            <DetailBlock label={t("dashboard.detail.valueAtRisk")} value={currencyFormatter.format(activeShipment.value)} detail={t("dashboard.detail.priorityShipment", { priority: activeShipment.priority })} />
          </div>

          <div className="mt-1 flex flex-1 flex-col gap-2" data-rmr-detail-animate ref={scenarioRef}>
            <div className="rmr-label flex items-center gap-2 text-secondary">
              <CheckCircle2 className="size-[18px]" /> {t("dashboard.detail.scenarioEngine")}
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
                  <span className="rmr-label absolute right-3 top-3 rounded bg-secondary px-2 py-0.5 text-[9px] text-secondary-foreground">{t("dashboard.detail.recommended")}</span>
                ) : null}
                <div className="text-sm font-semibold text-foreground">
                  {scenario.label}
                </div>
                <div className="mt-2 flex flex-wrap gap-5 rmr-data">
                  <span className="text-destructive">{t("dashboard.detail.costLabel")} {scenario.costBand}</span>
                  <span className="text-secondary">{t("dashboard.detail.eta")} {scenario.etaImpact}</span>
                </div>
                <p className="mt-3 border-t border-border/30 pt-3 text-xs leading-5 text-muted-foreground">
                  {scenario.rationale}
                </p>
              </button>
            ))}
          </div>

          <div className="mt-auto grid gap-2 border-t border-border/30 pt-4" data-rmr-detail-animate>
            <Label className="rmr-label text-muted-foreground">{t("dashboard.decision.noteLabel")}</Label>
            <Textarea className="min-h-16" value={decisionNote} onChange={(event) => setDecisionNote(event.currentTarget.value)} placeholder={t("dashboard.decision.notePlaceholder")} />
            {decisionError ? <p className="text-sm font-semibold text-destructive">{decisionError}</p> : null}
          </div>

          {latestDecision ? (
            <div className="grid gap-2 rounded border border-border/40 bg-background/60 p-[var(--rmr-panel-pad)]" data-rmr-detail-animate>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="rmr-label flex items-center gap-2 text-muted-foreground">
                    {t("dashboard.outcome.title")}
                    {latestDecision.recommendationSource === "llm-dummy" || latestDecision.recommendationSource === "llm-openai" ? (
                      <span className="rmr-label rounded bg-secondary/15 px-2 py-0.5 text-secondary">
                        {t("dashboard.outcome.aiLabel", { provider: latestDecision.recommendationSource === "llm-dummy" ? "Dummy" : "OpenAI" })}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("dashboard.outcome.help")}
                  </p>
                </div>
                <select
                  className="h-9 rounded border border-input bg-background px-2 text-xs text-foreground"
                  value={outcomeStatus}
                  onChange={(event) => setOutcomeStatus(event.currentTarget.value as "pending" | "monitoring" | "successful" | "failed")}
                >
                  <option value="pending">{t("dashboard.outcome.statuses.pending")}</option>
                  <option value="monitoring">{t("dashboard.outcome.statuses.monitoring")}</option>
                  <option value="successful">{t("dashboard.outcome.statuses.successful")}</option>
                  <option value="failed">{t("dashboard.outcome.statuses.failed")}</option>
                </select>
              </div>
              <Textarea
                className="min-h-14"
                value={outcomeNote}
                onChange={(event) => setOutcomeNote(event.currentTarget.value)}
                placeholder={t("dashboard.outcome.notePlaceholder")}
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
                    setOutcomeMessage(t("dashboard.outcome.saved"));
                  }}
                  type="button"
                  variant="outline"
                >
                  {t("dashboard.outcome.save")}
                </Button>
                {outcomeMessage ? <span className="text-xs font-semibold text-secondary">{outcomeMessage}</span> : null}
              </div>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]" data-rmr-detail-animate>
            <Button className="rmr-label rounded bg-secondary text-secondary-foreground hover:bg-secondary-muted" onClick={() => handleDecision("approved")}>
              {t("dashboard.decision.execute")}
            </Button>
            <Button className="rmr-label rounded" variant="outline" onClick={() => handleDecision("deferred")}>{t("dashboard.decision.defer")}</Button>
            <Button className="rmr-label size-10 rounded p-0" variant="destructive" onClick={() => handleDecision("rejected")} title={t("dashboard.decision.rejectTitle")}>
              <X className="size-4" />
            </Button>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{t("dashboard.detail.selectPrompt")}</p>
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
  const { t } = useTranslation();
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
      <div className="border-b border-amber-200 px-3 py-2 text-sm font-semibold dark:border-amber-900">
        {t("dashboard.import.issuesTitle")}
      </div>
      <div className="max-w-full overflow-hidden">
        <table className="w-full table-fixed text-left text-xs sm:text-sm">
          <thead className="border-b border-amber-200 text-xs uppercase text-amber-800 dark:border-amber-900 dark:text-amber-200">
            <tr>
              <th className="w-[16%] py-3 pl-2 pr-2 sm:pl-3">{t("dashboard.import.cols.row")}</th>
              <th className="w-[24%] py-3 pr-2">{t("dashboard.import.cols.shipment")}</th>
              <th className="w-[60%] py-3 pr-2">{t("dashboard.import.cols.issue")}</th>
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
  const { t } = useTranslation();
  return <label className="grid min-w-0 gap-1 text-xs font-semibold text-muted-foreground">{label}<select className="h-9 min-w-0 rounded-md border border-input bg-background px-3 text-sm text-foreground" value={value} onChange={(event) => onChange(event.currentTarget.value)}>{options.map((option) => <option key={option} value={option}>{translateFilterOption(t, option)}</option>)}</select></label>;
}

function CompactSelect({ onChange, options, value }: { onChange: (value: string) => void; options: string[]; value: string }) {
  const { t } = useTranslation();
  return (
    <select
      className="h-8 min-w-0 rounded border border-input bg-background px-2 text-xs text-foreground"
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
    >
      {options.map((option) => (
        <option key={option} value={option}>{translateFilterOption(t, option)}</option>
      ))}
    </select>
  );
}

function translateFilterOption(t: (key: string, opts?: any) => string, option: string): string {
  const key = `dashboard.filterOptions.${option}`;
  const translated = t(key);
  if (translated && translated !== key) return translated;
  return formatAction(option);
}

function RiskBadge({ level, score }: { level: RiskLevel | DisruptionSeverity; score?: number }) {
  const { t } = useTranslation();
  const className = level === "critical" ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200" : level === "high" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200" : level === "medium" ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200" : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100";
  const labelKey = `dashboard.riskLevels.${level}`;
  const translated = t(labelKey);
  const label = translated && translated !== labelKey ? translated : level;
  return <span className={`inline-flex max-w-full rounded-full px-2 py-1 text-xs font-semibold leading-tight [overflow-wrap:anywhere] ${className}`}>{label}{typeof score === "number" ? ` ${score}/100` : ""}</span>;
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
