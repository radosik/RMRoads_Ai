import { useTranslation } from "react-i18next";
import { useAuth } from "wasp/client/auth";
import { Link as WaspRouterLink, routes } from "wasp/client/router";

type FooterLink = { name: string; href: string; external?: boolean };
type FooterColumn = { title: string; links: FooterLink[] };

function FooterColumnBlock({ column }: { column: FooterColumn }) {
  return (
    <div>
      <h3 className="rmr-label text-secondary">{column.title}</h3>
      <ul className="mt-4 space-y-3">
        {column.links.map((link) => (
          <li key={link.name}>
            <a
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              className="text-sm leading-6 text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RMRoadsFooter() {
  const { data: user } = useAuth();
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  const productLinks: FooterLink[] = [
    { name: t("footer.links.howItWorks"), href: "/#workflow" },
    { name: t("footer.links.workbenchPreview"), href: "/#workbench" },
    { name: t("footer.links.trustControl"), href: "/#trust" },
    { name: t("footer.links.pilotAudit"), href: "/pilot" },
  ];
  const resourcesLinks: FooterLink[] = [
    { name: t("footer.links.blog"), href: "/blog", external: true },
    { name: t("footer.links.docs"), href: "https://docs.opensaas.sh", external: true },
    { name: t("footer.links.pilotBrief"), href: "/pilot" },
  ];
  const legalLinks: FooterLink[] = [
    { name: t("footer.links.privacy"), href: "#" },
    { name: t("footer.links.terms"), href: "#" },
    { name: t("footer.links.cookies"), href: "#" },
  ];
  const plannerLinks: FooterLink[] = [
    { name: t("footer.links.workspaceLink"), href: "/rmroads" },
    { name: t("footer.links.settingsLink"), href: "/rmroads/settings" },
    { name: t("footer.links.pendingInvitations"), href: "/rmroads/invitations" },
  ];
  const adminLinks: FooterLink[] = [
    { name: t("footer.links.tenantHealth"), href: "/admin/tenant-health" },
    { name: t("footer.links.recommendationsLog"), href: "/admin/recommendations" },
    { name: t("footer.links.pilotLeads"), href: "/admin/pilot-leads" },
  ];

  const columns: FooterColumn[] = user
    ? user.isAdmin
      ? [
          { title: t("footer.columns.admin"), links: adminLinks },
          { title: t("footer.columns.workspace"), links: plannerLinks },
          { title: t("footer.columns.legal"), links: legalLinks },
        ]
      : [
          { title: t("footer.columns.workspace"), links: plannerLinks },
          { title: t("footer.columns.product"), links: productLinks },
          { title: t("footer.columns.legal"), links: legalLinks },
        ]
    : [
        { title: t("footer.columns.product"), links: productLinks },
        { title: t("footer.columns.resources"), links: resourcesLinks },
        { title: t("footer.columns.legal"), links: legalLinks },
      ];

  return (
    <footer
      aria-labelledby="rmroads-footer-heading"
      className="relative border-t border-border/40 bg-background/60"
    >
      <h2 id="rmroads-footer-heading" className="sr-only">
        Site footer
      </h2>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.4fr_minmax(0,3fr)] lg:gap-16 lg:px-8 lg:py-16">
        <div className="max-w-sm">
          <WaspRouterLink
            to={routes.LandingPageRoute.to}
            className="inline-flex items-baseline text-lg font-bold tracking-tight"
          >
            <span className="bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              RMRoads
            </span>
            <span className="rmr-text-glow ml-1.5 font-extrabold uppercase tracking-[0.14em] text-secondary">
              AI
            </span>
          </WaspRouterLink>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {t("footer.tagline")}
          </p>
          <div className="mt-6 flex items-center gap-2">
            <span className="rmr-glow size-2 rounded-full bg-secondary" />
            <span className="rmr-label text-muted-foreground">{t("footer.systemsActive")}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {columns.map((column) => (
            <FooterColumnBlock column={column} key={column.title} />
          ))}
        </div>
      </div>
      <div className="border-t border-border/30">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <span>{t("footer.copyright", { year })}</span>
          <span className="rmr-data">{t("footer.disclaimer")}</span>
        </div>
      </div>
    </footer>
  );
}
