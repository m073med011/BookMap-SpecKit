import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui";
import type { Locale } from "@/types";

type AuthLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AuthLayout({
  children,
  params,
}: AuthLayoutProps) {
  const { locale: requestedLocale } = await params;
  const locale = requestedLocale as Locale;
  const t = await getTranslations({ locale, namespace: "common" });

  return (
    <main className="from-background via-background to-muted/30 flex min-h-screen items-center justify-center bg-gradient-to-b px-6 py-10">
      <Card className="w-full max-w-md border-border/70 shadow-xl">
        <CardContent className="space-y-6 p-6">
          <div className="space-y-2 text-center">
            <p className="text-primary text-sm font-semibold uppercase tracking-[0.3em]">
              {t("appName")}
            </p>
            <p className="text-muted-foreground text-sm">{t("tagline")}</p>
          </div>
          {children}
        </CardContent>
      </Card>
    </main>
  );
}
