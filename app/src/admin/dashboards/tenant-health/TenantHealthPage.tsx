import type { AuthUser } from "wasp/auth";
import { getRMRoadsTenantHealth, useQuery } from "wasp/client/operations";
import { Card, CardContent, CardHeader, CardTitle } from "../../../client/components/ui/card";
import DefaultLayout from "../../layout/DefaultLayout";

function AdminTenantHealth({ user }: { user: AuthUser }) {
  const tenantHealthQuery = useQuery(getRMRoadsTenantHealth);
  const tenants = tenantHealthQuery.data || [];
  const totalShipments = tenants.reduce((sum, tenant) => sum + tenant.shipmentCount, 0);
  const totalExceptions = tenants.reduce((sum, tenant) => sum + tenant.exceptionCount, 0);
  const totalDecisions = tenants.reduce((sum, tenant) => sum + tenant.decisionCount, 0);

  return (
    <DefaultLayout user={user}>
      <div className="grid gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tenant Health</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Monitor workspace readiness before paid pilots: users, imports, shipments, exceptions, decisions, alerts, and pilot status.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Active Workspaces" value={tenants.length} />
          <MetricCard label="Tracked Shipments" value={totalShipments} />
          <MetricCard label="Planner Decisions" value={totalDecisions} detail={`${totalExceptions} exceptions`} />
        </section>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Workspace Readiness</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            {tenantHealthQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading tenant health...</p> : null}
            {tenantHealthQuery.error ? (
              <p className="text-sm font-semibold text-destructive">Could not load tenant health.</p>
            ) : null}
            {!tenantHealthQuery.isLoading && tenants.length === 0 ? (
              <p className="text-sm text-muted-foreground">No RMRoads workspaces yet.</p>
            ) : null}
            {tenants.length ? (
              <div className="max-w-full overflow-hidden rounded-md border border-border">
                <table className="w-full table-fixed text-left text-xs sm:text-sm">
                  <thead className="border-b text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="w-[20%] py-3 pl-2 pr-2 sm:pl-3">Workspace</th>
                      <th className="w-[16%] py-3 pr-2">Pilot</th>
                      <th className="w-[14%] py-3 pr-2">Members</th>
                      <th className="w-[16%] py-3 pr-2">Data</th>
                      <th className="w-[16%] py-3 pr-2">Workflow</th>
                      <th className="w-[18%] py-3 pr-2">Readiness</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map((tenant) => (
                      <tr className="border-b last:border-b-0" key={tenant.id}>
                        <td className="py-4 pl-2 pr-2 align-top [overflow-wrap:anywhere] sm:pl-3">
                          <span className="block font-semibold">{tenant.name}</span>
                          <span className="block text-xs text-muted-foreground">{tenant.slug}</span>
                          <span className="block text-xs text-muted-foreground">Created {formatDate(tenant.createdAt)}</span>
                        </td>
                        <td className="py-4 pr-2 align-top [overflow-wrap:anywhere]">
                          <span className="block font-semibold">{formatStatus(tenant.pilotMode)}</span>
                          <span className="block text-xs text-muted-foreground">{tenant.pilotTargetDecisionHours}h target</span>
                          <span className="block text-xs text-muted-foreground">{tenant.pilotSuccessMetric}</span>
                        </td>
                        <td className="py-4 pr-2 align-top">
                          <span className="block">{tenant.memberCount} members</span>
                          <span className="block text-xs text-muted-foreground">{tenant.pendingInvitationCount} pending invites</span>
                          <span className="block text-xs text-muted-foreground">{tenant.alertRecipientCount} alert recipients</span>
                          <span className="block text-xs text-muted-foreground">{tenant.alertEmailsEnabled ? "Alerts on" : "Alerts off"}</span>
                        </td>
                        <td className="py-4 pr-2 align-top">
                          <span className="block">{tenant.shipmentCount} shipments</span>
                          <span className="block text-xs text-muted-foreground">{tenant.importCount} imports</span>
                          <span className="block text-xs text-muted-foreground">Latest {tenant.latestImportAt ? formatDate(tenant.latestImportAt) : "-"}</span>
                        </td>
                        <td className="py-4 pr-2 align-top">
                          <span className="block">{tenant.exceptionCount} exceptions</span>
                          <span className="block text-xs text-muted-foreground">{tenant.decisionCount} decisions</span>
                          <span className="block text-xs text-muted-foreground">{tenant.alertCount} alerts</span>
                        </td>
                        <td className="py-4 pr-2 align-top">
                          <span
                            className={
                              tenant.securityReviewCompleted
                                ? "inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                                : "inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                            }
                          >
                            {tenant.securityReviewCompleted ? "Security reviewed" : "Review pending"}
                          </span>
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

function MetricCard({ detail, label, value }: { detail?: string; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-sm font-semibold text-muted-foreground">{label}</div>
        <div className="mt-2 text-3xl font-bold">{value}</div>
        {detail ? <div className="mt-1 text-xs text-muted-foreground">{detail}</div> : null}
      </CardContent>
    </Card>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default AdminTenantHealth;
