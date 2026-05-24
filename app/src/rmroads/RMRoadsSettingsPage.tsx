import { useEffect, useState, type FormEvent } from "react";
import { Link as WaspRouterLink, routes } from "wasp/client/router";
import {
  cancelRMRoadsWorkspaceInvitation,
  createRMRoadsWorkspaceInvitation,
  getRMRoadsWorkspaceSettings,
  updateRMRoadsWorkspaceSettings,
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
import { Switch } from "../client/components/ui/switch";
import { Textarea } from "../client/components/ui/textarea";

type PilotMode = "demo" | "paid_pilot" | "production_readiness";

const defaultForm = {
  name: "",
  alertEmailsEnabled: false,
  alertRecipients: "",
  pilotMode: "demo" as PilotMode,
  pilotSuccessMetric: "Time-to-decision and protected shipment value",
  pilotTargetDecisionHours: 4,
  securityReviewCompleted: false,
};

export default function RMRoadsSettingsPage() {
  const settingsQuery = useQuery(getRMRoadsWorkspaceSettings);
  const settings = settingsQuery.data;
  const [form, setForm] = useState(defaultForm);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "planner" | "viewer">("planner");
  const [message, setMessage] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    if (!settings?.organization) return;

    setForm({
      name: settings.organization.name,
      alertEmailsEnabled: settings.organization.alertEmailsEnabled,
      alertRecipients: settings.organization.alertRecipients.join(", "),
      pilotMode: settings.organization.pilotMode as PilotMode,
      pilotSuccessMetric: settings.organization.pilotSuccessMetric,
      pilotTargetDecisionHours: settings.organization.pilotTargetDecisionHours,
      securityReviewCompleted: settings.organization.securityReviewCompleted,
    });
  }, [settings?.organization]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setIsSaving(true);

    try {
      await updateRMRoadsWorkspaceSettings(form);
      await settingsQuery.refetch();
      setMessage("Workspace settings saved.");
    } catch (error: any) {
      setMessage(error.message || "Could not save workspace settings.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleInvitationSubmit(event: FormEvent) {
    event.preventDefault();
    setInviteMessage("");
    setIsInviting(true);

    try {
      await createRMRoadsWorkspaceInvitation({ email: inviteEmail, role: inviteRole });
      setInviteEmail("");
      setInviteRole("planner");
      await settingsQuery.refetch();
      setInviteMessage("Invitation saved.");
    } catch (error: any) {
      setInviteMessage(error.message || "Could not create invitation.");
    } finally {
      setIsInviting(false);
    }
  }

  async function handleCancelInvitation(invitationId: string) {
    setInviteMessage("");
    try {
      await cancelRMRoadsWorkspaceInvitation({ invitationId });
      await settingsQuery.refetch();
      setInviteMessage("Invitation cancelled.");
    } catch (error: any) {
      setInviteMessage(error.message || "Could not cancel invitation.");
    }
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-6">
        <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="rmr-label text-secondary">Workspace readiness</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">RMRoads Settings</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              Configure the organization, pilot target, alert recipients, invitations, and readiness controls before importing real pilot data.
            </p>
          </div>
          <Button asChild variant="outline">
            <WaspRouterLink to={routes.RMRoadsDashboardRoute.to}>Back to Workspace</WaspRouterLink>
          </Button>
        </header>

        {settingsQuery.isLoading ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">Loading workspace settings...</CardContent>
          </Card>
        ) : null}

        {settingsQuery.error ? (
          <Card>
            <CardContent className="p-6 text-sm font-semibold text-destructive">Could not load workspace settings.</CardContent>
          </Card>
        ) : null}

        {settings ? (
          <form className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]" onSubmit={handleSubmit}>
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Organization</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="workspace-name">Workspace name</Label>
                    <Input
                      id="workspace-name"
                      value={form.name}
                      onChange={(event) => setForm((current) => ({ ...current, name: event.currentTarget.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Workspace slug</Label>
                    <Input disabled value={settings.organization.slug} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pilot Configuration</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Pilot mode</Label>
                    <Select value={form.pilotMode} onValueChange={(value) => setForm((current) => ({ ...current, pilotMode: value as PilotMode }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="demo">Demo workspace</SelectItem>
                        <SelectItem value="paid_pilot">Paid pilot</SelectItem>
                        <SelectItem value="production_readiness">Production readiness</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pilot-target">Target decision time, hours</Label>
                    <Input
                      id="pilot-target"
                      min={1}
                      max={168}
                      type="number"
                      value={form.pilotTargetDecisionHours}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          pilotTargetDecisionHours: Number(event.currentTarget.value) || 1,
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pilot-metric">Pilot success metric</Label>
                    <Textarea
                      id="pilot-metric"
                      value={form.pilotSuccessMetric}
                      onChange={(event) => setForm((current) => ({ ...current, pilotSuccessMetric: event.currentTarget.value }))}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Critical Alerts</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <label className="flex items-center justify-between gap-4 rounded border border-border bg-card-subtle p-4">
                    <span>
                      <span className="block text-sm font-semibold">Enable critical email alerts</span>
                      <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                        Alerts are sent only for critical exceptions after recipients are configured.
                      </span>
                    </span>
                    <Switch
                      checked={form.alertEmailsEnabled}
                      onCheckedChange={(checked) => setForm((current) => ({ ...current, alertEmailsEnabled: checked }))}
                    />
                  </label>
                  <div className="grid gap-2">
                    <Label htmlFor="alert-recipients">Alert recipients</Label>
                    <Textarea
                      id="alert-recipients"
                      placeholder="ops@example.com, logistics@example.com"
                      value={form.alertRecipients}
                      onChange={(event) => setForm((current) => ({ ...current, alertRecipients: event.currentTarget.value }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <aside className="grid content-start gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Team Members</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {settings.members.map((member) => (
                    <div className="rounded border border-border bg-card-subtle p-3" key={member.id}>
                      <div className="text-sm font-semibold">{member.email || member.username || "Workspace member"}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{formatRole(member.role)} · Added {formatDate(member.createdAt)}</div>
                    </div>
                  ))}
                  <form className="grid gap-3 rounded border border-border bg-card-subtle p-3" onSubmit={handleInvitationSubmit}>
                    <div>
                      <div className="text-sm font-semibold">Invite teammate</div>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Track pilot invites here. Account acceptance can stay high-touch until the first paid pilot requires self-serve onboarding.
                      </p>
                    </div>
                    <Input
                      aria-label="Invite email"
                      placeholder="teammate@example.com"
                      type="email"
                      value={inviteEmail}
                      onChange={(event) => setInviteEmail(event.currentTarget.value)}
                    />
                    <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as "admin" | "planner" | "viewer")}>
                      <SelectTrigger aria-label="Invitation role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planner">Planner</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button disabled={isInviting} type="submit">
                      {isInviting ? "Saving..." : "Create Invitation"}
                    </Button>
                    {inviteMessage ? <p className="text-xs font-semibold text-secondary">{inviteMessage}</p> : null}
                  </form>
                  <div className="grid gap-2">
                    <div className="text-sm font-semibold">Invitations</div>
                    {settings.invitations.map((invitation) => (
                      <div className="rounded border border-border bg-background p-3" key={invitation.id}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="break-words text-sm font-semibold">{invitation.email}</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {formatRole(invitation.role)} · {formatRole(invitation.status)} · Sent {formatDate(invitation.createdAt)}
                            </div>
                          </div>
                          {invitation.status === "pending" ? (
                            <Button
                              onClick={() => handleCancelInvitation(invitation.id)}
                              size="sm"
                              type="button"
                              variant="outline"
                            >
                              Cancel
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                    {!settings.invitations.length ? (
                      <p className="rounded border border-dashed border-border p-3 text-xs leading-5 text-muted-foreground">
                        No invitations yet. Operational contact: {settings.manualInviteEmail}
                      </p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pre-Pilot Readiness</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <label className="flex items-start justify-between gap-4 rounded border border-border bg-card-subtle p-4">
                    <span>
                      <span className="block text-sm font-semibold">Tenant security review completed</span>
                      <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                        Use this only after tenant-scoped actions and data import handling have been reviewed.
                      </span>
                    </span>
                    <Switch
                      checked={form.securityReviewCompleted}
                      onCheckedChange={(checked) => setForm((current) => ({ ...current, securityReviewCompleted: checked }))}
                    />
                  </label>
                  {message ? <p className="text-sm font-semibold text-secondary">{message}</p> : null}
                  <Button disabled={isSaving} type="submit">
                    {isSaving ? "Saving..." : "Save Workspace Settings"}
                  </Button>
                </CardContent>
              </Card>
            </aside>
          </form>
        ) : null}
      </div>
    </main>
  );
}

function formatRole(role: string) {
  return role.charAt(0).toUpperCase() + role.slice(1);
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
