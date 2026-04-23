export type Locale = "en" | "ar";
export type Direction = "ltr" | "rtl";
export type Theme = "light" | "dark" | "system";

export const localeDirection: Record<Locale, Direction> = {
  en: "ltr",
  ar: "rtl",
};

export const locales: Locale[] = ["en", "ar"];
export const defaultLocale: Locale = "en";
