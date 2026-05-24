import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  Truck,
} from "lucide-react";
import {
  useMemo,
  useEffect,
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
  toggleRMRoadsDisruptionEventStatus,
  updateRMRoadsAlertSettings,
  upsertRMRoadsDisruptionEvent,
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
  DisruptionStatus,
  ExceptionStatus,
  RiskLevel,
  ScenarioAction,
} from "./domain/types";

const owners = ["Maya Chen", "Leo Martins", "Nina Patel", "Ops Review"];
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const defaultEventForm = {
  id: "",
  type: "Port congestion",
  severity: "high" as DisruptionSeverity,
  affectedText: "Los Angeles CA",
  mode: "Ocean",
  carrier: "",
  confidence: 75,
  source: "Manual pilot signal",
};

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
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [selectedShipmentId, setSelectedShipmentId] = useState("");
  const [selectedExceptionId, setSelectedExceptionId] = useState("");
  const [selectedScenarioAction, setSelectedScenarioAction] = useState<ScenarioAction | "">("");
  const [decisionNote, setDecisionNote] = useState("");
  const [decisionError, setDecisionError] = useState("");
  const [eventForm, setEventForm] = useState(defaultEventForm);
  const dashboardQuery = useQuery(getRMRoadsDashboard);
  const dashboard = dashboardQuery.data;
  const shipments = dashboard?.shipments || [];
  const exceptions = dashboard?.exceptions || [];
  const selectedShipment = shipments.find((shipment) => shipment.id === selectedShipmentId);
  const selectedException = exceptions.find((exception) => exception.id === selectedExceptionId) || exceptions[0];
  const selectedExceptionShipment = selectedException
    ? shipments.find((shipment) => shipment.id === selectedException.shipmentId)
    : undefined;
  const recommendation =
    selectedException && selectedExceptionShipment
      ? generateRecommendation(selectedException, selectedExceptionShipment)
      : undefined;
  const selectedAction =
    selectedScenarioAction || selectedException?.selectedScenarioAction || recommendation?.primaryAction || "watch";

  const modes = useMemo(
    () => Array.from(new Set(shipments.map((shipment) => shipment.mode))).sort(),
    [shipments],
  );
  const filteredShipments = shipments.filter((shipment) => {
    const priorityMatch = priorityFilter === "all" || shipment.priority === priorityFilter;
    const modeMatch = modeFilter === "all" || shipment.mode === modeFilter;
    return priorityMatch && modeMatch;
  });
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
      setSelectedShipmentId("");
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

  const handleEventSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await upsertRMRoadsDisruptionEvent(eventForm);
    setEventForm(defaultEventForm);
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
    <main className="bg-background min-h-screen py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3">
          <div className="text-muted-foreground text-sm font-semibold uppercase tracking-wide">
            RMRoads AI
          </div>
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
                Disruption Response Workspace
              </h1>
              <p className="text-muted-foreground mt-3 max-w-3xl text-base leading-7">
                Import active shipments, manage disruption signals, rank
                exceptions, compare recovery actions, and keep planner approval
                in the loop.
              </p>
            </div>
            <Button onClick={handleSeedDemoData} disabled={dashboardQuery.isFetching}>
              {shipments.length ? "Refresh Demo Data" : "Load Demo Workspace"}
            </Button>
          </div>
        </header>

        {dashboardQuery.isLoading ? (
          <Card className="min-w-0 overflow-hidden">
            <CardContent className="p-6 text-sm text-muted-foreground">Loading RMRoads workspace...</CardContent>
          </Card>
        ) : null}

        {dashboardQuery.error ? (
          <Card className="min-w-0 overflow-hidden">
            <CardContent className="p-6 text-sm text-red-700 dark:text-red-300">
              Could not load the RMRoads workspace. Check the server logs and database connection.
            </CardContent>
          </Card>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          <MetricCard icon={<Truck className="h-5 w-5" />} label="Shipments" value={dashboard?.shipmentCount || 0} />
          <MetricCard icon={<AlertTriangle className="h-5 w-5" />} label="Open Exceptions" value={dashboard?.exceptionCount || 0} />
          <MetricCard icon={<ClipboardList className="h-5 w-5" />} label="Critical Risk" value={dashboard?.criticalExceptionCount || 0} />
          <MetricCard icon={<DollarSign className="h-5 w-5" />} label="Shipment Value" value={currencyFormatter.format(dashboard?.totalValue || 0)} />
          <MetricCard icon={<CheckCircle2 className="h-5 w-5" />} label="Reviewed" value={dashboard?.reviewedCount || 0} />
          <MetricCard icon={<CheckCircle2 className="h-5 w-5" />} label="Protected" value={currencyFormatter.format(dashboard?.estimatedProtectedValue || 0)} />
        </section>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Shipment CSV Import</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)] md:items-start">
            <div className="min-w-0">
              <p className="text-muted-foreground text-sm">
                Upload the MVP shipment CSV schema. Valid shipments are stored in
                Postgres and risk scoring recalculates from active events.
              </p>
              {importMessage ? (
                <p className="mt-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">{importMessage}</p>
              ) : null}
            </div>
            <div className="grid min-w-0 gap-3">
              <Button onClick={handleDownloadTemplate} type="button" variant="outline">
                Download CSV Template
              </Button>
              <Input className="min-w-0" accept=".csv,text/csv" disabled={isImporting} onChange={handleCsvImport} type="file" />
            </div>
            {importErrors.length ? (
              <div className="min-w-0 md:col-span-2">
                <ImportErrorsTable errors={importErrors} />
              </div>
            ) : null}
          </CardContent>
        </Card>

        {!dashboardQuery.isLoading && shipments.length === 0 ? (
          <Card className="min-w-0 overflow-hidden">
            <CardContent className="flex flex-col gap-4 p-6">
              <div>
                <h2 className="text-xl font-bold">No shipment data yet</h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  Load the demo workspace or import a shipment CSV to start the workflow.
                </p>
              </div>
              <Button className="w-fit" onClick={handleSeedDemoData}>Load Demo Workspace</Button>
            </CardContent>
          </Card>
        ) : null}

        <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <ShipmentsCard
            filteredShipments={filteredShipments}
            modeFilter={modeFilter}
            modes={modes}
            priorityFilter={priorityFilter}
            selectedShipmentId={selectedShipmentId}
            setModeFilter={setModeFilter}
            setPriorityFilter={setPriorityFilter}
            setSelectedShipmentId={setSelectedShipmentId}
            shipmentsLength={shipments.length}
          />
          <ShipmentDetailCard shipment={selectedShipment} />
        </section>

        <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <DisruptionEventsCard
            eventForm={eventForm}
            events={dashboard?.disruptionEvents || []}
            handleEventSubmit={handleEventSubmit}
            refreshDashboard={refreshDashboard}
            setEventForm={setEventForm}
          />
          <ExceptionQueueCard
            exceptionsLength={exceptions.length}
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
        </section>

        <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <RecommendationCard
            decisionError={decisionError}
            decisionNote={decisionNote}
            handleDecision={handleDecision}
            recommendation={recommendation}
            selectedAction={selectedAction}
            selectedException={selectedException}
            setDecisionNote={setDecisionNote}
            setSelectedScenarioAction={setSelectedScenarioAction}
          />
          <PilotValueCard dashboard={dashboard} />
        </section>

        <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1.1fr)]">
          <AlertSettingsCard
            message={alertSettingsMessage}
            onSubmit={handleAlertSettingsSubmit}
            organization={dashboard?.organization}
          />
          <ImportHistoryCard importHistory={dashboard?.importHistory || []} />
          <AlertLogCard alerts={dashboard?.alerts || []} />
        </section>
      </div>
    </main>
  );
}

function ShipmentsCard({
  filteredShipments,
  modeFilter,
  modes,
  priorityFilter,
  selectedShipmentId,
  setModeFilter,
  setPriorityFilter,
  setSelectedShipmentId,
  shipmentsLength,
}: any) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <CardTitle>Imported Shipments</CardTitle>
            <p className="text-muted-foreground mt-2 text-sm">
              {shipmentsLength ? `${filteredShipments.length} of ${shipmentsLength} shipments shown.` : "No CSV imported yet."}
            </p>
          </div>
          <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
            <NativeSelect label="Priority" value={priorityFilter} onChange={setPriorityFilter} options={["all", "critical", "high", "standard"]} />
            <NativeSelect label="Mode" value={modeFilter} onChange={setModeFilter} options={["all", ...modes]} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="min-w-0">
        <div className="max-w-full overflow-hidden rounded-md border border-border">
          <table className="w-full table-fixed text-left text-xs sm:text-sm">
            <thead className="text-muted-foreground border-b text-xs uppercase">
              <tr>
                <th className="w-[16%] py-3 pl-2 pr-2 sm:pl-3">Shipment</th>
                <th className="w-[18%] py-3 pr-2">Customer</th>
                <th className="w-[26%] py-3 pr-2">Lane</th>
                <th className="w-[12%] py-3 pr-2">ETA</th>
                <th className="w-[16%] py-3 pr-2">Risk</th>
                <th className="w-[12%] py-3 pr-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredShipments.map((shipment: any) => (
                <tr className={selectedShipmentId === shipment.id ? "border-b bg-emerald-50 dark:bg-emerald-950/30" : "border-b last:border-b-0"} key={shipment.id}>
                  <td className="py-4 pl-2 pr-2 align-top font-semibold [overflow-wrap:anywhere] sm:pl-3">{shipment.id}<span className="block text-xs font-normal text-muted-foreground [overflow-wrap:anywhere]">{shipment.skuGroup}</span></td>
                  <td className="py-4 pr-2 align-top [overflow-wrap:anywhere]">{shipment.customer}</td>
                  <td className="py-4 pr-2 align-top [overflow-wrap:anywhere]">{shipment.origin} → {shipment.destination}<span className="block text-xs text-muted-foreground [overflow-wrap:anywhere]">{shipment.mode} · {shipment.carrier}</span></td>
                  <td className="py-4 pr-2 align-top [overflow-wrap:anywhere]">{shipment.eta}</td>
                  <td className="py-4 pr-2 align-top"><RiskBadge level={shipment.riskLevel} score={shipment.riskScore} /></td>
                  <td className="py-4 pr-2 align-top"><Button className="h-auto min-h-8 w-full whitespace-normal px-2 py-1" size="sm" variant="outline" onClick={() => setSelectedShipmentId(shipment.id)}>Detail</Button></td>
                </tr>
              ))}
              {!filteredShipments.length ? <EmptyRow colSpan={6} message="No shipments match the current filters." /> : null}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function ShipmentDetailCard({ shipment }: any) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader><CardTitle>Shipment Detail</CardTitle></CardHeader>
      <CardContent>
        {shipment ? (
          <div className="grid gap-4 md:grid-cols-2">
            <DetailBlock label="Lane" value={`${shipment.origin} → ${shipment.destination}`} detail={`${shipment.mode} via ${shipment.carrier}`} />
            <DetailBlock label="Business Impact" value={currencyFormatter.format(shipment.value)} detail={`${shipment.priority} priority · ${shipment.destinationLocation}`} />
            <ListBlock label="Risk Reasons" items={shipment.riskReasons.length ? shipment.riskReasons : ["No active risk reasons."]} />
            <ListBlock label="Matched Events" items={shipment.matchedEvents.length ? shipment.matchedEvents.map((event: any) => `${event.id} ${event.type}: ${event.reason}`) : ["No matched disruption events."]} />
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Select a shipment to inspect risk reasons and matched events.</p>
        )}
      </CardContent>
    </Card>
  );
}

function DisruptionEventsCard({ eventForm, events, handleEventSubmit, refreshDashboard, setEventForm }: any) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader><CardTitle>Manual Disruption Events</CardTitle></CardHeader>
      <CardContent className="grid min-w-0 gap-5">
        <form className="grid gap-3 md:grid-cols-2" onSubmit={handleEventSubmit}>
          <TextInput label="Event type" value={eventForm.type} onChange={(type) => setEventForm({ ...eventForm, type })} />
          <NativeSelect label="Severity" value={eventForm.severity} onChange={(severity) => setEventForm({ ...eventForm, severity })} options={["low", "medium", "high", "critical"]} />
          <TextInput label="Affected text" value={eventForm.affectedText} onChange={(affectedText) => setEventForm({ ...eventForm, affectedText })} />
          <TextInput label="Mode" value={eventForm.mode} onChange={(mode) => setEventForm({ ...eventForm, mode })} />
          <TextInput label="Carrier" value={eventForm.carrier} onChange={(carrier) => setEventForm({ ...eventForm, carrier })} />
          <TextInput label="Confidence" type="number" value={String(eventForm.confidence)} onChange={(confidence) => setEventForm({ ...eventForm, confidence: Number(confidence) })} />
          <div className="md:col-span-2"><TextInput label="Source" value={eventForm.source} onChange={(source) => setEventForm({ ...eventForm, source })} /></div>
          <div className="flex gap-2 md:col-span-2">
            <Button type="submit">{eventForm.id ? "Update Event" : "Add Event"}</Button>
            {eventForm.id ? <Button type="button" variant="outline" onClick={() => setEventForm(defaultEventForm)}>Cancel</Button> : null}
          </div>
        </form>
        <div className="max-w-full overflow-hidden rounded-md border border-border">
          <table className="w-full table-fixed text-left text-xs sm:text-sm">
            <thead className="text-muted-foreground border-b text-xs uppercase">
              <tr><th className="w-[24%] py-3 pl-2 pr-2 sm:pl-3">Event</th><th className="w-[26%] py-3 pr-2">Affected</th><th className="w-[16%] py-3 pr-2">Severity</th><th className="w-[14%] py-3 pr-2">Status</th><th className="w-[20%] py-3 pr-2">Actions</th></tr>
            </thead>
            <tbody>
              {events.map((event: any) => (
                <tr className="border-b last:border-b-0" key={event.id}>
                  <td className="py-4 pl-2 pr-2 align-top font-semibold [overflow-wrap:anywhere] sm:pl-3">{event.type}<span className="block text-xs font-normal text-muted-foreground [overflow-wrap:anywhere]">{event.source}</span></td>
                  <td className="py-4 pr-2 align-top [overflow-wrap:anywhere]">{event.affectedText}<span className="block text-xs text-muted-foreground [overflow-wrap:anywhere]">{event.mode || "Any mode"} · {event.carrier || "Any carrier"}</span></td>
                  <td className="py-4 pr-2 align-top"><RiskBadge level={event.severity} /></td>
                  <td className="py-4 pr-2 align-top"><StatusBadge status={event.status} /></td>
                  <td className="py-4 pr-2 align-top">
                    <div className="flex flex-wrap gap-2">
                      <Button className="h-auto min-h-8 whitespace-normal px-2 py-1" size="sm" variant="outline" onClick={() => setEventForm(event)}>Edit</Button>
                      <Button className="h-auto min-h-8 whitespace-normal px-2 py-1" size="sm" variant="outline" onClick={async () => { await toggleRMRoadsDisruptionEventStatus({ id: event.id }); await refreshDashboard(); }}>{event.status === "active" ? "Archive" : "Activate"}</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!events.length ? <EmptyRow colSpan={5} message="No disruption events created." /> : null}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function ExceptionQueueCard(props: any) {
  const {
    exceptionsLength,
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
  } = props;
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div><CardTitle>Exception Queue</CardTitle><p className="text-muted-foreground mt-2 text-sm">{filteredExceptions.length} of {exceptionsLength} exceptions shown.</p></div>
          <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3">
            <NativeSelect label="Owner" value={ownerFilter} onChange={setOwnerFilter} options={["all", "unassigned", ...owners]} />
            <NativeSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={["all", "new", "approved", "deferred", "rejected"]} />
            <NativeSelect label="Risk" value={riskFilter} onChange={setRiskFilter} options={["all", "medium", "high", "critical"]} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="min-w-0">
        <div className="max-w-full overflow-hidden rounded-md border border-border">
          <table className="w-full table-fixed text-left text-xs sm:text-sm">
            <thead className="text-muted-foreground border-b text-xs uppercase">
              <tr><th className="w-[14%] py-3 pl-2 pr-2 sm:pl-3">Exception</th><th className="w-[15%] py-3 pr-2">Customer</th><th className="w-[21%] py-3 pr-2">Lane</th><th className="w-[14%] py-3 pr-2">Risk</th><th className="w-[16%] py-3 pr-2">Owner</th><th className="w-[10%] py-3 pr-2">Status</th><th className="w-[10%] py-3 pr-2">Action</th></tr>
            </thead>
            <tbody>
              {filteredExceptions.map((exception: any) => (
                <tr className={selectedExceptionId === exception.id ? "border-b bg-emerald-50 dark:bg-emerald-950/30" : "border-b last:border-b-0"} key={exception.id}>
                  <td className="py-4 pl-2 pr-2 align-top font-semibold [overflow-wrap:anywhere] sm:pl-3">{exception.id}<span className="block text-xs font-normal text-muted-foreground [overflow-wrap:anywhere]">{exception.shipmentId}</span></td>
                  <td className="py-4 pr-2 align-top [overflow-wrap:anywhere]">{exception.customer}</td>
                  <td className="py-4 pr-2 align-top [overflow-wrap:anywhere]">{exception.lane}</td>
                  <td className="py-4 pr-2 align-top"><RiskBadge level={exception.riskLevel} score={exception.riskScore} /></td>
                  <td className="py-4 pr-2 align-top"><OwnerSelect exception={exception} refreshDashboard={refreshDashboard} /></td>
                  <td className="py-4 pr-2 align-top"><StatusBadge status={exception.status} /></td>
                  <td className="py-4 pr-2 align-top"><Button className="h-auto min-h-8 w-full whitespace-normal px-2 py-1" size="sm" onClick={() => setSelectedExceptionId(exception.id)}>Review</Button></td>
                </tr>
              ))}
              {!filteredExceptions.length ? <EmptyRow colSpan={7} message="No exceptions match the current filters." /> : null}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function RecommendationCard({ decisionError, decisionNote, handleDecision, recommendation, selectedAction, selectedException, setDecisionNote, setSelectedScenarioAction }: any) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader><CardTitle>Recommendation Review</CardTitle></CardHeader>
      <CardContent>
        {recommendation && selectedException ? (
          <div className="grid gap-5">
            <div><div className="text-muted-foreground text-xs font-semibold uppercase">{recommendation.confidence} confidence</div><h2 className="mt-2 text-xl font-bold">{recommendation.summary}</h2></div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {recommendation.scenarios.map((scenario: any) => (
                <button className={scenario.action === selectedAction ? "min-w-0 rounded-md border border-emerald-300 bg-emerald-50 p-4 text-left text-foreground dark:border-emerald-800 dark:bg-emerald-950/30" : "min-w-0 rounded-md border border-border bg-card p-4 text-left text-foreground hover:bg-muted/40"} key={scenario.action} onClick={() => setSelectedScenarioAction(scenario.action)} type="button">
                  <div className="flex min-w-0 flex-wrap items-center justify-between gap-3"><strong className="break-words">{scenario.label}</strong>{scenario.recommended ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">Recommended</span> : null}</div>
                  <p className="text-muted-foreground mt-2 text-sm">{scenario.rationale}</p>
                  <dl className="mt-3 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-muted-foreground">ETA</dt><dd>{scenario.etaImpact}</dd></div><div><dt className="text-muted-foreground">Cost</dt><dd>{scenario.costBand}</dd></div></dl>
                </button>
              ))}
            </div>
            <div className="grid gap-2">
              <Label>Decision note</Label>
              <Textarea value={decisionNote} onChange={(event) => setDecisionNote(event.currentTarget.value)} placeholder="Add the operational reason for the decision." />
              {decisionError ? <p className="text-sm font-semibold text-red-700 dark:text-red-300">{decisionError}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2"><Button onClick={() => handleDecision("approved")}>Approve</Button><Button variant="outline" onClick={() => handleDecision("deferred")}>Defer</Button><Button variant="destructive" onClick={() => handleDecision("rejected")}>Reject</Button></div>
          </div>
        ) : <p className="text-muted-foreground text-sm">Select an exception to generate response scenarios.</p>}
      </CardContent>
    </Card>
  );
}

function PilotValueCard({ dashboard }: any) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader><CardTitle>Pilot Value Dashboard</CardTitle></CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <MiniMetric label="Reviewed" value={dashboard?.reviewedCount || 0} />
          <MiniMetric label="Approved" value={dashboard?.approvedCount || 0} />
          <MiniMetric label="Deferred" value={dashboard?.deferredCount || 0} />
          <MiniMetric label="Rejected" value={dashboard?.rejectedCount || 0} />
          <MiniMetric label="Avg Risk" value={dashboard?.averageRiskScore || 0} />
        </div>
        <div className="max-w-full overflow-hidden rounded-md border border-border">
          <table className="w-full table-fixed text-left text-xs sm:text-sm">
            <thead className="text-muted-foreground border-b text-xs uppercase"><tr><th className="w-[17%] py-3 pl-2 pr-2 sm:pl-3">Decision</th><th className="w-[18%] py-3 pr-2">Customer</th><th className="w-[14%] py-3 pr-2">Action</th><th className="w-[15%] py-3 pr-2">Owner</th><th className="w-[16%] py-3 pr-2">Protected</th><th className="w-[20%] py-3 pr-2">Note</th></tr></thead>
            <tbody>{(dashboard?.decisions || []).map((decision: any) => <tr className="border-b last:border-b-0" key={decision.id}><td className="py-4 pl-2 pr-2 align-top sm:pl-3"><StatusBadge status={decision.status} /><span className="block text-xs text-muted-foreground [overflow-wrap:anywhere]">{formatDateTime(decision.decidedAt)}</span></td><td className="py-4 pr-2 align-top [overflow-wrap:anywhere]">{decision.customer}<span className="block text-xs text-muted-foreground [overflow-wrap:anywhere]">{decision.shipmentId}</span></td><td className="py-4 pr-2 align-top [overflow-wrap:anywhere]">{formatAction(decision.scenarioAction)}</td><td className="py-4 pr-2 align-top [overflow-wrap:anywhere]">{decision.owner || "Unassigned"}</td><td className="py-4 pr-2 align-top [overflow-wrap:anywhere]">{currencyFormatter.format(decision.estimatedProtectedValue)}</td><td className="py-4 pr-2 align-top [overflow-wrap:anywhere]">{decision.note || "-"}</td></tr>)}{!dashboard?.decisions?.length ? <EmptyRow colSpan={6} message="No planner decisions yet." /> : null}</tbody>
          </table>
        </div>
      </CardContent>
    </Card>
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
  return <SimpleTableCard title="Critical Alert Log" empty="No critical alerts generated yet." headers={["Created", "Sent", "Shipment", "Risk", "Message"]} rows={alerts.map((alert: any) => [formatDateTime(alert.createdAt), alert.sentAt ? formatDateTime(alert.sentAt) : "Not sent", alert.shipmentId, `${alert.riskLevel} ${alert.riskScore}/100`, alert.message])} />;
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

function MetricCard({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
  return <Card className="min-w-0 overflow-hidden"><CardContent className="flex min-w-0 items-center justify-between gap-4 p-5"><div className="min-w-0"><div className="text-muted-foreground text-sm font-semibold">{label}</div><div className="mt-2 break-words text-2xl font-bold leading-tight 2xl:text-[1.7rem]">{value}</div></div><div className="shrink-0 rounded-md bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">{icon}</div></CardContent></Card>;
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return <div className="min-w-0 rounded-md border border-border bg-card-subtle p-3 text-card-subtle-foreground"><div className="text-muted-foreground text-xs font-semibold">{label}</div><div className="mt-1 break-words text-xl font-bold leading-tight">{value}</div></div>;
}

function DetailBlock({ detail, label, value }: { detail: string; label: string; value: string }) {
  return <div className="min-w-0 rounded-md border border-border bg-card-subtle p-4 text-card-subtle-foreground"><div className="text-muted-foreground text-xs font-semibold uppercase">{label}</div><strong className="mt-2 block break-words">{value}</strong><p className="text-muted-foreground mt-2 break-words text-sm">{detail}</p></div>;
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

function TextInput({ label, onChange, type = "text", value }: { label: string; onChange: (value: string) => void; type?: string; value: string }) {
  return <label className="grid gap-1 text-xs font-semibold text-muted-foreground">{label}<Input type={type} value={value} onChange={(event) => onChange(event.currentTarget.value)} /></label>;
}

function RiskBadge({ level, score }: { level: RiskLevel | DisruptionSeverity; score?: number }) {
  const className = level === "critical" ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200" : level === "high" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200" : level === "medium" ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200" : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100";
  return <span className={`inline-flex max-w-full rounded-full px-2 py-1 text-xs font-semibold leading-tight [overflow-wrap:anywhere] ${className}`}>{level}{typeof score === "number" ? ` ${score}/100` : ""}</span>;
}

function StatusBadge({ status }: { status: ExceptionStatus | DisruptionStatus }) {
  const className = status === "approved" || status === "active" || status === "new" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" : status === "deferred" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200" : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200";
  return <span className={`inline-flex max-w-full rounded-full px-2 py-1 text-xs font-semibold leading-tight [overflow-wrap:anywhere] ${className}`}>{status}</span>;
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
