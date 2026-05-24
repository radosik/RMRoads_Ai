import type { AuthUser } from "wasp/auth";
import { getRMRoadsPilotLeads, useQuery } from "wasp/client/operations";
import { Card, CardContent, CardHeader, CardTitle } from "../../../client/components/ui/card";
import DefaultLayout from "../../layout/DefaultLayout";

function AdminPilotLeads({ user }: { user: AuthUser }) {
  const { data: leads = [], error, isLoading } = useQuery(getRMRoadsPilotLeads);

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
          <CardHeader>
            <CardTitle>Recent Requests</CardTitle>
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
                      <th className="w-[16%] py-3 pr-2">Company</th>
                      <th className="w-[14%] py-3 pr-2">Volume</th>
                      <th className="w-[22%] py-3 pr-2">Pain</th>
                      <th className="w-[22%] py-3 pr-2">Pilot Goal</th>
                      <th className="w-[8%] py-3 pr-2">Status</th>
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
                        <td className="py-4 pr-2 align-top [overflow-wrap:anywhere]">{lead.status}</td>
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

export default AdminPilotLeads;
