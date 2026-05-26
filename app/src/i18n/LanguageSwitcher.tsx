import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../client/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../client/components/ui/dropdown-menu";
import { cn } from "../client/utils";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "./index";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n, t } = useTranslation();
  const active = (i18n.resolvedLanguage ?? i18n.language ?? "en") as SupportedLanguage;
  const current = SUPPORTED_LANGUAGES.find((l) => l.code === active) ?? SUPPORTED_LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={t("nav.languageMenuLabel")}
          className={cn(
            "rmr-label h-8 gap-1.5 px-2 text-muted-foreground hover:text-foreground",
            compact && "px-1.5",
          )}
        >
          <Globe className="size-3.5" aria-hidden />
          <span className="uppercase">{current.code}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onSelect={() => {
              void i18n.changeLanguage(lang.code);
            }}
            className={cn("gap-2 text-sm", lang.code === active && "font-semibold text-foreground")}
          >
            <span aria-hidden>{lang.flag}</span>
            <span>{lang.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
