"use client";

import { startTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/lib/i18n/routing";
import type { Locale } from "@/types";

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("locale");

  const targetLocale: Locale = locale === "en" ? "ar" : "en";

  const handleSwitch = () => {
    startTransition(() => {
      router.replace(pathname, { locale: targetLocale });
    });
  };

  return (
    <button
      aria-label={t("switchTo", { locale: t(targetLocale) })}
      className="bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm transition-colors"
      onClick={handleSwitch}
      type="button"
    >
      {t(targetLocale)}
    </button>
  );
}
