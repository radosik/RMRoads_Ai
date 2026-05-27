import {
  Activity,
  LayoutDashboard,
  Lightbulb,
  MailPlus,
  Sheet,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";
import { cn } from "../../client/utils";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

type SidebarItem = {
  to: string;
  icon: typeof LayoutDashboard;
  labelKey: string;
};

const ITEMS: SidebarItem[] = [
  { to: "/admin", icon: LayoutDashboard, labelKey: "admin.sidebar.overview" },
  { to: "/admin/pilot-leads", icon: MailPlus, labelKey: "admin.sidebar.pilotLeads" },
  { to: "/admin/tenant-health", icon: Activity, labelKey: "admin.sidebar.tenantHealth" },
  { to: "/admin/recommendations", icon: Lightbulb, labelKey: "admin.sidebar.recommendations" },
  { to: "/admin/users", icon: Sheet, labelKey: "admin.sidebar.users" },
];

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const { t } = useTranslation();
  const trigger = useRef<any>(null);
  const sidebar = useRef<any>(null);

  const storedSidebarExpanded = localStorage.getItem("sidebar-expanded");
  const [sidebarExpanded, setSidebarExpanded] = useState(
    storedSidebarExpanded === null ? false : storedSidebarExpanded === "true",
  );

  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebar.current || !trigger.current) return;
      if (
        !sidebarOpen ||
        sidebar.current.contains(target) ||
        trigger.current.contains(target)
      )
        return;
      setSidebarOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  });

  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!sidebarOpen || keyCode !== 27) return;
      setSidebarOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  useEffect(() => {
    localStorage.setItem("sidebar-expanded", sidebarExpanded.toString());
    if (sidebarExpanded) {
      document.querySelector("body")?.classList.add("sidebar-expanded");
    } else {
      document.querySelector("body")?.classList.remove("sidebar-expanded");
    }
  }, [sidebarExpanded]);

  return (
    <aside
      ref={sidebar}
      className={cn(
        "bg-muted absolute top-0 left-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden border-r duration-300 ease-linear lg:static lg:translate-x-0",
        {
          "translate-x-0": sidebarOpen,
          "-translate-x-full": !sidebarOpen,
        },
      )}
    >
      <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
        <NavLink to="/" className="inline-flex items-baseline font-bold tracking-tight text-[1.2rem]">
          <span className="bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
            RMRoads
          </span>
          <span className="rmr-text-glow ml-1.5 font-extrabold uppercase tracking-[0.14em] text-secondary text-[1rem]">
            AI
          </span>
        </NavLink>

        <button
          ref={trigger}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-controls="sidebar"
          aria-expanded={sidebarOpen}
          className="block lg:hidden"
        >
          <X />
        </button>
      </div>

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="mt-5 px-4 py-4 lg:mt-9 lg:px-6">
          <div>
            <h3 className="text-muted-foreground mb-4 ml-4 text-sm font-semibold">
              {t("admin.sidebar.menuHeader")}
            </h3>

            <ul className="mb-6 flex flex-col gap-1.5">
              {ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end
                      className={({ isActive }) =>
                        cn(
                          "text-muted-foreground hover:bg-accent hover:text-accent-foreground group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium duration-300 ease-in-out",
                          {
                            "bg-accent text-accent-foreground": isActive,
                          },
                        )
                      }
                    >
                      <Icon />
                      {t(item.labelKey)}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
