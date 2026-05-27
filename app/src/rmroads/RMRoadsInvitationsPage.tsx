import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link as WaspRouterLink, routes } from "wasp/client/router";
import {
  acceptRMRoadsWorkspaceInvitation,
  getRMRoadsPendingInvitations,
  useQuery,
} from "wasp/client/operations";
import { Button } from "../client/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../client/components/ui/card";

export default function RMRoadsInvitationsPage() {
  const { t, i18n } = useTranslation();
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
      setMessage(t("invitations.accepted"));
    } catch (error: any) {
      setMessage(error.message || t("invitations.acceptFailed"));
    } finally {
      setAcceptingId("");
    }
  }

  const localeForDate = i18n.language || "en";

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-4xl gap-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="rmr-label text-secondary">{t("invitations.eyebrow")}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t("invitations.title")}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              {t("invitations.intro")}
            </p>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground">
              {t("invitations.accountNote")}
            </p>
          </div>
          <Button asChild variant="outline">
            <WaspRouterLink to={routes.RMRoadsDashboardRoute.to}>{t("invitations.openWorkspace")}</WaspRouterLink>
          </Button>
        </header>

        {invitationsQuery.isLoading ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">{t("invitations.loading")}</CardContent>
          </Card>
        ) : null}

        {invitationsQuery.error ? (
          <Card>
            <CardContent className="p-6 text-sm font-semibold text-destructive">{t("invitations.loadError")}</CardContent>
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
              <h2 className="text-lg font-semibold">{t("invitations.empty.title")}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t("invitations.empty.body")}
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
                    <dt className="text-muted-foreground">{t("invitations.role")}</dt>
                    <dd className="font-semibold">{lookupStatusLabel(t, invitation.role)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t("invitations.invitedBy")}</dt>
                    <dd className="break-words">{invitation.sentBy}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t("invitations.sent")}</dt>
                    <dd>{formatDate(invitation.createdAt, localeForDate)}</dd>
                  </div>
                </dl>
              </div>
              <Button disabled={acceptingId === invitation.id} onClick={() => handleAccept(invitation.id)}>
                {acceptingId === invitation.id ? t("invitations.accepting") : t("invitations.accept")}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}

function lookupStatusLabel(t: (key: string, opts?: any) => string, value: string): string {
  const key = `settings.statuses.${value}`;
  const translated = t(key);
  if (translated && translated !== key) return translated;
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
