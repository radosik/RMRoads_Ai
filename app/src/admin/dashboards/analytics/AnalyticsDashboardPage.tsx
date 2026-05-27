import { Activity, ArrowRight, Lightbulb, MailPlus, Sheet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { type AuthUser } from "wasp/auth";
import { Link as WaspRouterLink, routes } from "wasp/client/router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../client/components/ui/card";
import DefaultLayout from "../../layout/DefaultLayout";

const TOOLS = [
  {
    icon: MailPlus,
    titleKey: "admin.overview.tools.pilotLeads.title",
    descKey: "admin.overview.tools.pilotLeads.desc",
    to: routes.AdminPilotLeadsRoute.to,
  },
  {
    icon: Activity,
    titleKey: "admin.overview.tools.tenantHealth.title",
    descKey: "admin.overview.tools.tenantHealth.desc",
    to: routes.AdminTenantHealthRoute.to,
  },
  {
    icon: Lightbulb,
    titleKey: "admin.overview.tools.recommendations.title",
    descKey: "admin.overview.tools.recommendations.desc",
    to: routes.AdminRecommendationsRoute.to,
  },
  {
    icon: Sheet,
    titleKey: "admin.overview.tools.users.title",
    descKey: "admin.overview.tools.users.desc",
    to: routes.AdminUsersRoute.to,
  },
] as const;

const Overview = ({ user }: { user: AuthUser }) => {
  const { t } = useTranslation();

  return (
    <DefaultLayout user={user}>
      <header className="mb-8">
        <p className="rmr-label text-secondary">{t("admin.overview.eyebrow")}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {t("admin.overview.title")}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          {t("admin.overview.intro")}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-4">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <WaspRouterLink key={tool.to} to={tool.to} className="group">
              <Card className="h-full transition-[transform,border-color] duration-200 group-hover:-translate-y-0.5 group-hover:border-secondary/60">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-base font-semibold">
                    {t(tool.titleKey)}
                  </CardTitle>
                  <Icon className="size-5 text-secondary" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {t(tool.descKey)}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.08em] text-secondary">
                    {t("admin.overview.open")}
                    <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </CardContent>
              </Card>
            </WaspRouterLink>
          );
        })}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            {t("admin.overview.about.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm leading-6 text-muted-foreground">
          <p>{t("admin.overview.about.body")}</p>
          <p>
            {t("admin.overview.about.docs")}{" "}
            <a
              href="https://github.com/radosik/RMRoads_Ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary underline"
            >
              github.com/radosik/RMRoads_Ai
            </a>
          </p>
        </CardContent>
      </Card>
    </DefaultLayout>
  );
};

export default Overview;
