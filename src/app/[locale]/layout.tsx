import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { HtmlAttributesSync } from "@/components/shared/HtmlAttributesSync";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ToastProvider } from "@/providers/ToastProvider";
import { defaultLocale, localeDirection, locales, type Locale } from "@/types";

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

function isSupportedLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale: requestedLocale } = await params;

  if (!isSupportedLocale(requestedLocale)) {
    redirect(`/${defaultLocale}`);
  }

  const locale = requestedLocale;
  const direction = localeDirection[locale];

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <div className="min-h-screen" dir={direction} lang={locale}>
      <HtmlAttributesSync direction={direction} locale={locale} />
      <NextIntlClientProvider locale={locale} messages={messages}>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </NextIntlClientProvider>
    </div>
  );
}
