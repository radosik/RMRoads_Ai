import { useTranslation } from "react-i18next";

function LegalStub({
  pageKey,
  sectionIds,
}: {
  pageKey: "privacy" | "terms" | "cookies";
  sectionIds: readonly string[];
}) {
  const { t } = useTranslation();

  return (
    <main className="rmr-grid-bg min-h-screen bg-background px-4 py-16 text-foreground sm:px-6 lg:px-8 lg:py-24">
      <section className="relative z-10 mx-auto max-w-3xl">
        <div className="rmr-label flex items-center gap-2 text-secondary">
          <span className="size-2 rounded-full bg-secondary rmr-glow" />
          {t("legal.eyebrow")}
        </div>
        <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          {t(`legal.${pageKey}.title`)}
        </h1>
        <p className="rmr-data mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {t("legal.lastUpdatedLabel")} {t(`legal.${pageKey}.updated`)}
        </p>
        <p className="mt-6 text-base leading-7 text-muted-foreground">
          {t(`legal.${pageKey}.intro`)}
        </p>

        <div className="mt-10 space-y-6">
          {sectionIds.map((sectionId) => (
            <article key={sectionId} className="rmr-panel p-6">
              <h2 className="rmr-label text-secondary">
                {t(`legal.${pageKey}.sections.${sectionId}.heading`)}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {t(`legal.${pageKey}.sections.${sectionId}.body`)}
              </p>
            </article>
          ))}
        </div>

        <p className="rmr-data mt-10 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {t("legal.placeholderNotice")}
        </p>
      </section>
    </main>
  );
}

const PRIVACY_SECTIONS = ["collect", "use", "sharing", "choices", "contact"] as const;
const TERMS_SECTIONS = ["using", "account", "acceptable", "availability", "contact"] as const;
const COOKIE_SECTIONS = ["necessary", "preferences", "analytics", "manage"] as const;

export function PrivacyPage() {
  return <LegalStub pageKey="privacy" sectionIds={PRIVACY_SECTIONS} />;
}

export function TermsPage() {
  return <LegalStub pageKey="terms" sectionIds={TERMS_SECTIONS} />;
}

export function CookiesPage() {
  return <LegalStub pageKey="cookies" sectionIds={COOKIE_SECTIONS} />;
}
