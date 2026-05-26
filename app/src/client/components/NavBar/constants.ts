import type { TFunction } from "i18next";
import { routes } from "wasp/client/router";
import type { NavigationItem } from "./NavBar";

// Nav builders take t so the labels live in the i18n catalog. Component
// re-renders on language change picks up new labels automatically.

export function buildPublicNav(t: TFunction): NavigationItem[] {
  return [
    { name: t("nav.product"), to: routes.LandingPageRoute.to },
    { name: t("nav.pilot"), to: routes.RMRoadsPilotRoute.to },
  ];
}

export function buildPlannerNav(t: TFunction): NavigationItem[] {
  return [
    { name: t("nav.workspace"), to: routes.RMRoadsDashboardRoute.to },
    { name: t("nav.settings"), to: routes.RMRoadsSettingsRoute.to },
    { name: t("nav.pilot"), to: routes.RMRoadsPilotRoute.to },
  ];
}

export function buildAdminNav(t: TFunction): NavigationItem[] {
  return [
    { name: t("nav.workspace"), to: routes.RMRoadsDashboardRoute.to },
    { name: t("nav.tenantHealth"), to: routes.AdminTenantHealthRoute.to },
    { name: t("nav.recommendations"), to: routes.AdminRecommendationsRoute.to },
    { name: t("nav.pilotLeads"), to: routes.AdminPilotLeadsRoute.to },
  ];
}
