import { useState } from "react";
import { Link as WaspRouterLink, routes } from "wasp/client/router";
import {
  acceptRMRoadsWorkspaceInvitation,
  getRMRoadsPendingInvitations,
  useQuery,
} from "wasp/client/operations";
import { Button } from "../client/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../client/components/ui/card";

export default function RMRoadsInvitationsPage() {
  const invitationsQuery = useQuery(getRMRoadsPendingInvitations);
  const invitations = invitationsQuery.data || [];
  const [message, setMessage] = useState("");
  const [acceptingId, setAcceptingId] = useState("");

  async function handleAccept(invitationId: string) {
    setMessage("");
    setAcceptingId(invitationId);

    try {
      await acceptRMRoadsWorkspaceInvitation({ invitationId });
      await invitationsQuery.refetch();
      setMessage("Invitation accepted. You can now open the workspace.");
    } catch (error: any) {
      setMessage(error.message || "Could not accept invitation.");
    } finally {
      setAcceptingId("");
    }
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-4xl gap-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="rmr-label text-secondary">Workspace access</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Invitations</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Review pending RMRoads AI workspace invitations connected to your sign-in email.
            </p>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground">
              Pilot accounts use one active workspace. Accept the intended invitation before creating sample data or configuring a new workspace.
            </p>
          </div>
          <Button asChild variant="outline">
            <WaspRouterLink to={routes.RMRoadsDashboardRoute.to}>Open Workspace</WaspRouterLink>
          </Button>
        </header>

        {invitationsQuery.isLoading ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">Loading invitations...</CardContent>
          </Card>
        ) : null}

        {invitationsQuery.error ? (
          <Card>
            <CardContent className="p-6 text-sm font-semibold text-destructive">Could not load invitations.</CardContent>
          </Card>
        ) : null}

        {message ? (
          <Card>
            <CardContent className="p-4 text-sm font-semibold text-secondary">{message}</CardContent>
          </Card>
        ) : null}

        {!invitationsQuery.isLoading && invitations.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold">No pending invitations</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                If a teammate invited you, make sure you signed in with the same email address used for the invitation.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {invitations.map((invitation) => (
          <Card key={invitation.id}>
            <CardHeader>
              <CardTitle>{invitation.organizationName}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="min-w-0">
                <dl className="grid gap-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Role</dt>
                    <dd className="font-semibold">{formatLabel(invitation.role)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Invited by</dt>
                    <dd className="break-words">{invitation.sentBy}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Sent</dt>
                    <dd>{formatDate(invitation.createdAt)}</dd>
                  </div>
                </dl>
              </div>
              <Button disabled={acceptingId === invitation.id} onClick={() => handleAccept(invitation.id)}>
                {acceptingId === invitation.id ? "Accepting..." : "Accept Invitation"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}

function formatLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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
