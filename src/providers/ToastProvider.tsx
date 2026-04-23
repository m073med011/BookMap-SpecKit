"use client";

import type { ReactNode } from "react";
import { useLocale } from "next-intl";
import { GooeyToaster } from "goey-toast";
import { useTheme } from "next-themes";
import { localeDirection, type Locale } from "@/types";

type ToastProviderProps = {
  children: ReactNode;
};

export function ToastProvider({ children }: ToastProviderProps) {
  const locale = useLocale() as Locale;
  const { resolvedTheme } = useTheme();
  const direction = localeDirection[locale] ?? "ltr";
  const position = direction === "rtl" ? "top-left" : "top-right";

  return (
    <>
      {children}
      <GooeyToaster
        closeButton="top-right"
        dir={direction}
        duration={5000}
        position={position}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        visibleToasts={4}
      />
    </>
  );
}
