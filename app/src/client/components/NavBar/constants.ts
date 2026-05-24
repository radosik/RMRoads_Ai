import { routes } from "wasp/client/router";
import type { NavigationItem } from "./NavBar";

export const rmroadsNavigationItems: NavigationItem[] = [
  { name: "Features", to: "/#features" },
  { name: "Workspace", to: routes.RMRoadsDashboardRoute.to },
  { name: "Pilot", to: routes.RMRoadsPilotRoute.to },
  { name: "Blog", to: "https://docs.opensaas.sh/blog" },
] as const;
