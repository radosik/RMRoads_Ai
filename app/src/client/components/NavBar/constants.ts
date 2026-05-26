import { routes } from "wasp/client/router";
import type { NavigationItem } from "./NavBar";

// Marketing nav for visitors who are not signed in. Keep it short and
// pointed at the conversion path (pilot audit request).
export const rmroadsPublicNav: NavigationItem[] = [
  { name: "Product", to: routes.LandingPageRoute.to },
  { name: "Pilot", to: routes.RMRoadsPilotRoute.to },
] as const;

// Planner nav for authenticated non-admin users — workspace surfaces only.
export const rmroadsPlannerNav: NavigationItem[] = [
  { name: "Workspace", to: routes.RMRoadsDashboardRoute.to },
  { name: "Settings", to: routes.RMRoadsSettingsRoute.to },
  { name: "Pilot", to: routes.RMRoadsPilotRoute.to },
] as const;

// Admin nav adds operator-only routes. Tenant health is the natural
// landing because it shows pilot readiness at a glance.
export const rmroadsAdminNav: NavigationItem[] = [
  { name: "Workspace", to: routes.RMRoadsDashboardRoute.to },
  { name: "Tenant Health", to: routes.AdminTenantHealthRoute.to },
  { name: "Recommendations", to: routes.AdminRecommendationsRoute.to },
  { name: "Pilot Leads", to: routes.AdminPilotLeadsRoute.to },
] as const;

// Legacy export retained for any imports that have not been migrated;
// defaults to the planner set.
export const rmroadsNavigationItems = rmroadsPlannerNav;
