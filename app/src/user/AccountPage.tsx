import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { User } from "wasp/entities";
import { Button } from "../client/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../client/components/ui/card";
import { Separator } from "../client/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../client/components/ui/select";
import useColorMode from "../client/hooks/useColorMode";
import { LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES, type SupportedLanguage } from "../i18n";

export default function AccountPage({ user }: { user: User }) {
  const { t, i18n } = useTranslation();
  const [colorMode, setColorMode] = useColorMode() as [string, (mode: string) => void];

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
    } catch {
      // localStorage unavailable — language detector falls back.
    }
  };

  return (
    <main className="mx-auto mt-10 max-w-3xl px-4 pb-16 sm:px-6 lg:px-8">
      <header className="mb-6">
        <p className="rmr-label text-secondary">{t("account.eyebrow")}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t("account.title")}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          {t("account.intro")}
        </p>
      </header>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("account.profile.title")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-0">
              {!!user.email && (
                <ProfileRow label={t("account.profile.email")} value={user.email} />
              )}
              {!!user.username && (
                <>
                  <Separator />
                  <ProfileRow label={t("account.profile.username")} value={user.username} />
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("account.preferences.title")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 px-6 py-4">
            <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <div className="text-sm font-semibold">{t("account.preferences.language")}</div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {t("account.preferences.languageHelp")}
                </p>
              </div>
              <Select value={(i18n.language || "en") as SupportedLanguage} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <span className="mr-2">{lang.flag}</span>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <div className="text-sm font-semibold">{t("account.preferences.theme")}</div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {t("account.preferences.themeHelp")}
                </p>
              </div>
              <div className="inline-flex overflow-hidden rounded border border-border">
                <button
                  className={
                    "flex items-center gap-2 px-3 py-2 text-xs font-semibold " +
                    (colorMode === "light"
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-background text-muted-foreground hover:text-foreground")
                  }
                  onClick={() => setColorMode("light")}
                  type="button"
                >
                  <Sun className="size-4" /> {t("account.preferences.themes.light")}
                </button>
                <button
                  className={
                    "flex items-center gap-2 px-3 py-2 text-xs font-semibold " +
                    (colorMode === "dark"
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-background text-muted-foreground hover:text-foreground")
                  }
                  onClick={() => setColorMode("dark")}
                  type="button"
                >
                  <Moon className="size-4" /> {t("account.preferences.themes.dark")}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("account.security.title")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 px-6 py-4">
            <p className="text-sm leading-6 text-muted-foreground">
              {t("account.security.passwordHelp")}
            </p>
            <Button asChild variant="outline" className="justify-self-start">
              <a href="/request-password-reset">{t("account.security.changePassword")}</a>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-destructive">{t("account.danger.title")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 px-6 py-4">
            <p className="text-sm leading-6 text-muted-foreground">
              {t("account.danger.deleteHelp")}
            </p>
            <Button variant="destructive" className="justify-self-start" disabled title={t("account.danger.notWired")}>
              {t("account.danger.delete")}
            </Button>
            <p className="text-xs leading-5 text-muted-foreground">{t("account.danger.notWired")}</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-6 py-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 sm:gap-4">
        <div className="text-muted-foreground text-sm font-medium">{label}</div>
        <div className="text-foreground mt-1 break-words text-sm sm:col-span-2 sm:mt-0">{value}</div>
      </div>
    </div>
  );
}
