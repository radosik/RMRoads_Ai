import { routes } from "wasp/client/router";
import type { NavigationItem } from "./NavBar";

export const rmroadsNavigationItems: NavigationItem[] = [
  { name: "Workspace", to: routes.RMRoadsDashboardRoute.to },
  { name: "Settings", to: routes.RMRoadsSettingsRoute.to },
  { name: "Pilot", to: routes.RMRoadsPilotRoute.to },
] as const;
