"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils/cn";
import type { Theme } from "@/types";

const themeOrder: Theme[] = ["system", "light", "dark"];

const themeIcons: Record<Theme, string> = {
  system: "system",
  light: "light",
  dark: "dark",
};

function subscribeToHydration() {
  return () => {};
}

function SunIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a6.5 6.5 0 0 0 11 11Z" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <rect height="12" rx="2" width="18" x="3" y="4" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}

export function ThemeToggle() {
  const t = useTranslations("theme");
  const { resolvedTheme, setTheme, theme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );

  const currentTheme = (theme ?? "system") as Theme;
  const resolvedThemeLabel =
    resolvedTheme === "light" || resolvedTheme === "dark"
      ? t(resolvedTheme)
      : t("system");

  const handleToggle = () => {
    const currentIndex = themeOrder.indexOf(currentTheme);
    const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length] ?? "system";
    setTheme(nextTheme);
  };

  const renderIcon = () => {
    if (!mounted) {
      return <MonitorIcon />;
    }

    switch (themeIcons[currentTheme]) {
      case "light":
        return <SunIcon />;
      case "dark":
        return <MoonIcon />;
      default:
        return <MonitorIcon />;
    }
  };

  return (
    <button
      aria-label={t("toggleTheme")}
      className={cn(
        "bg-background inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
      )}
      onClick={handleToggle}
      title={t("toggleTheme")}
      type="button"
    >
      <span className="sr-only">
        {mounted
          ? `${t(currentTheme)} / ${resolvedThemeLabel}`
          : t("toggleTheme")}
      </span>
      {renderIcon()}
    </button>
  );
}
