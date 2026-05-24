import type { AuthUser } from "wasp/auth";
import {
  getRMRoadsPilotLeads,
  updateRMRoadsPilotLeadStatus,
  useQuery,
} from "wasp/client/operations";
import { Card, CardContent, CardHeader, CardTitle } from "../../../client/components/ui/card";
import DefaultLayout from "../../layout/DefaultLayout";

type PilotLeadStatus = "new" | "contacted" | "qualified" | "rejected";

const PILOT_LEAD_STATUSES: PilotLeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "rejected",
];

function AdminPilotLeads({ user }: { user: AuthUser }) {
  const leadsQuery = useQuery(getRMRoadsPilotLeads);
  const { data: leads = [], error, isLoading } = leadsQuery;

  async function handleStatusChange(id: string, status: PilotLeadStatus) {
    await updateRMRoadsPilotLeadStatus({ id, status });
    await leadsQuery.refetch();
  }

  function handleExportCsv() {
    if (!leads.length) return;

    const rows = [
      [
        "Created",
        "Name",
        "Work Email",
        "Company",
        "Role",
        "Shipment Volume",
        "Current Tools",
        "Disruption Pain",
        "Pilot Goal",
        "Status",
      ],
      ...leads.map((lead) => [
        lead.createdAt,
        lead.name,
        lead.workEmail,
        lead.company,
        lead.role,
        lead.shipmentVolume,
        lead.currentTools,
        lead.disruptionPain,
        lead.pilotGoal,
        lead.status,
      ]),
    ];
    const csv = rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `rmroads-pilot-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <DefaultLayout user={user}>
      <div className="grid gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pilot Leads</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Review disruption audit and paid pilot requests submitted from the public pilot page.
          </p>
        </div>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Recent Requests</CardTitle>
            <button
              className="inline-flex min-h-10 w-full items-center justify-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              disabled={!leads.length}
              onClick={handleExportCsv}
              type="button"
            >
              Export CSV
            </button>
          </CardHeader>
          <CardContent className="min-w-0">
            {isLoading ? <p className="text-sm text-muted-foreground">Loading pilot leads...</p> : null}
            {error ? <p className="text-sm font-semibold text-red-700 dark:text-red-300">Could not load pilot leads.</p> : null}
            {!isLoading && !leads.length ? (
              <p className="text-sm text-muted-foreground">No pilot requests yet.</p>
            ) : null}
            {leads.length ? (
              <div className="max-w-full overflow-hidden rounded-md border border-border">
                <table className="w-full table-fixed text-left text-xs sm:text-sm">
                  <thead className="border-b text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="w-[18%] py-3 pl-2 pr-2 sm:pl-3">Contact</th>
                      <th className="w-[15%] py-3 pr-2">Company</th>
                      <th className="w-[13%] py-3 pr-2">Volume</th>
                      <th className="w-[20%] py-3 pr-2">Pain</th>
                      <th className="w-[20%] py-3 pr-2">Pilot Goal</th>
                      <th className="w-[14%] py-3 pr-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr className="border-b last:border-b-0" key={lead.id}>
                        <td className="py-4 pl-2 pr-2 align-top [overflow-wrap:anywhere] sm:pl-3">
                          <span className="block font-semibold">{lead.name}</span>
                          <span className="block text-xs text-muted-foreground">{lead.workEmail}</span>
                          <span className="block text-xs text-muted-foreground">{formatDateTime(lead.createdAt)}</span>
                        </td>
                        <td className="py-4 pr-2 align-top [overflow-wrap:anywhere]">
                          <span className="block font-semibold">{lead.company}</span>
                          <span className="block text-xs text-muted-foreground">{lead.role}</span>
                          <span className="block text-xs text-muted-foreground">{lead.currentTools}</span>
                        </td>
                        <td className="py-4 pr-2 align-top [overflow-wrap:anywhere]">{lead.shipmentVolume}</td>
                        <td className="py-4 pr-2 align-top [overflow-wrap:anywhere]">{lead.disruptionPain}</td>
                        <td className="py-4 pr-2 align-top [overflow-wrap:anywhere]">{lead.pilotGoal}</td>
                        <td className="py-4 pr-2 align-top">
                          <select
                            aria-label={`Status for ${lead.name}`}
                            className="min-h-9 w-full rounded-md border border-border bg-background px-2 text-xs font-medium text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                            defaultValue={lead.status}
                            onChange={(event) =>
                              handleStatusChange(lead.id, event.target.value as PilotLeadStatus)
                            }
                          >
                            {PILOT_LEAD_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {formatStatus(status)}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </DefaultLayout>
  );
}

function escapeCsvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default AdminPilotLeads;
