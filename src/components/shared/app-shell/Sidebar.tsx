"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/routing";
import type { Locale } from "@/types";
import { cn } from "@/lib/utils/cn";

const navIcons = {
  dashboard: "[]",
  home: "o",
};

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const locale = useLocale() as Locale;
  const t = useTranslations("nav");
  const appName = useTranslations("common");
  const collapseLabel = collapsed ? ">" : "<";
  const collapseIcon =
    locale === "ar"
      ? collapseLabel.split("").reverse().join("")
      : collapseLabel;

  return (
    <aside
      className={cn(
        "bg-background flex h-screen flex-col border-e transition-[width]",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex items-center gap-3 border-b py-4 ps-4 pe-4">
        <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl">
          BM
        </div>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate font-semibold">{appName("appName")}</p>
            <p className="text-muted-foreground text-xs">{t("dashboard")}</p>
          </div>
        ) : null}
      </div>

      <nav className="flex-1 space-y-2 py-4 ps-3 pe-3">
        <Link
          className="text-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-lg py-2.5 ps-3 pe-3 text-sm font-medium transition-colors"
          href="/"
        >
          <span aria-hidden="true">{navIcons.home}</span>
          {!collapsed ? <span>{t("home")}</span> : null}
        </Link>
        <Link
          className="text-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-lg py-2.5 ps-3 pe-3 text-sm font-medium transition-colors"
          href="/dashboard"
        >
          <span aria-hidden="true">{navIcons.dashboard}</span>
          {!collapsed ? <span>{t("dashboard")}</span> : null}
        </Link>
      </nav>

      <div className="border-t p-3">
        <button
          className="hover:bg-accent hover:text-accent-foreground flex w-full items-center justify-center rounded-lg border py-2 text-sm font-medium transition-colors"
          onClick={() => setCollapsed((value) => !value)}
          type="button"
        >
          {collapseIcon}
        </button>
      </div>
    </aside>
  );
}
