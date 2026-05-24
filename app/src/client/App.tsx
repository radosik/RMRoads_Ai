import { animate } from "animejs/animation";
import { useEffect, useMemo, useRef } from "react";
import { Outlet, useLocation } from "react-router";
import { routes } from "wasp/client/router";
import { Toaster } from "../client/components/ui/toaster";
import "./Main.css";
import NavBar from "./components/NavBar/NavBar";
import { rmroadsNavigationItems } from "./components/NavBar/constants";
import CookieConsentBanner from "./components/cookie-consent/Banner";

/**
 * use this component to wrap all child components
 * this is useful for templates, themes, and context
 */
export default function App() {
  const location = useLocation();
  const pageTransitionRef = useRef<HTMLDivElement | null>(null);

  const shouldDisplayAppNavBar = useMemo(() => {
    return (
      location.pathname !== routes.LoginRoute.build() &&
      location.pathname !== routes.SignupRoute.build()
    );
  }, [location]);

  const isAdminDashboard = useMemo(() => {
    return location.pathname.startsWith("/admin");
  }, [location]);

  const isLandingPage = useMemo(() => {
    return location.pathname === routes.LandingPageRoute.build();
  }, [location]);

  const isWorkbenchRoute = useMemo(() => {
    return location.pathname === routes.RMRoadsDashboardRoute.build();
  }, [location]);

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView();
      }
    }
  }, [location]);

  useEffect(() => {
    const element = pageTransitionRef.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const animation = animate(element, {
      opacity: { from: 0, to: 1 },
      y: { from: 12, to: 0 },
      filter: { from: "blur(5px)", to: "blur(0px)" },
      duration: 440,
      ease: "outCubic",
    });

    return () => {
      animation.cancel();
    };
  }, [location.pathname]);

  return (
    <>
      <div className="bg-background text-foreground min-h-screen">
        {!isLandingPage ? <MobileToolUnavailable /> : null}
        <div className={isLandingPage ? "" : "hidden md:block"} ref={pageTransitionRef}>
          {isAdminDashboard ? (
            <Outlet />
          ) : (
            <>
              {shouldDisplayAppNavBar && (
                <NavBar navigationItems={rmroadsNavigationItems} />
              )}
              <div className={isWorkbenchRoute ? "mx-auto w-full" : "mx-auto max-w-(--breakpoint-2xl)"}>
                <Outlet />
              </div>
            </>
          )}
        </div>
      </div>
      <Toaster position="bottom-right" />
      <CookieConsentBanner />
    </>
  );
}

function MobileToolUnavailable() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground md:hidden">
      <section className="max-w-sm rounded border border-border bg-card-subtle p-6 text-center shadow-sm">
        <div className="rmr-label mb-3 text-secondary">Desktop tool</div>
        <h1 className="text-2xl font-semibold">RMRoads AI is available on laptop and desktop.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          This workspace uses wide operational tables and scenario panels. Open it on a laptop or desktop screen to continue.
        </p>
      </section>
    </main>
  );
}
