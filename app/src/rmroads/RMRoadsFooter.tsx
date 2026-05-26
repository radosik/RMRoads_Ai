import { useAuth } from "wasp/client/auth";
import { Link as WaspRouterLink, routes } from "wasp/client/router";

type FooterLink = { name: string; href: string; external?: boolean };
type FooterColumn = { title: string; links: FooterLink[] };

const productLinks: FooterLink[] = [
  { name: "How it works", href: "/#workflow" },
  { name: "Workbench preview", href: "/#workbench" },
  { name: "Trust & control", href: "/#trust" },
  { name: "Pilot audit", href: "/pilot" },
];

const resourcesLinks: FooterLink[] = [
  { name: "Blog", href: "/blog", external: true },
  { name: "Docs", href: "https://docs.opensaas.sh", external: true },
  { name: "Pilot brief", href: "/pilot" },
];

const legalLinks: FooterLink[] = [
  { name: "Privacy", href: "#" },
  { name: "Terms of Service", href: "#" },
  { name: "Cookie settings", href: "#" },
];

const plannerLinks: FooterLink[] = [
  { name: "Workspace", href: "/rmroads" },
  { name: "Settings", href: "/rmroads/settings" },
  { name: "Pending invitations", href: "/rmroads/invitations" },
];

const adminLinks: FooterLink[] = [
  { name: "Tenant health", href: "/admin/tenant-health" },
  { name: "Recommendations log", href: "/admin/recommendations" },
  { name: "Pilot leads", href: "/admin/pilot-leads" },
];

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
  const year = new Date().getFullYear();

  const columns: FooterColumn[] = user
    ? user.isAdmin
      ? [
          { title: "Admin", links: adminLinks },
          { title: "Workspace", links: plannerLinks },
          { title: "Legal", links: legalLinks },
        ]
      : [
          { title: "Workspace", links: plannerLinks },
          { title: "Product", links: productLinks },
          { title: "Legal", links: legalLinks },
        ]
    : [
        { title: "Product", links: productLinks },
        { title: "Resources", links: resourcesLinks },
        { title: "Legal", links: legalLinks },
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
            Disruption response workbench for shipment planners. Rank exception risk, compare recovery options, and approve the response before delays hit customers.
          </p>
          <div className="mt-6 flex items-center gap-2">
            <span className="rmr-glow size-2 rounded-full bg-secondary" />
            <span className="rmr-label text-muted-foreground">All systems active</span>
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
          <span>© {year} RMRoads AI · Disruption response workbench</span>
          <span className="rmr-data">Recommendations are decision support. Planner approval is required.</span>
        </div>
      </div>
    </footer>
  );
}
