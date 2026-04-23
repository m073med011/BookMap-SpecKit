import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import type { Locale } from "@/types";

type AuthErrorPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ error?: string; provider?: string }>;
};

export async function generateMetadata({
  params,
}: AuthErrorPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });

  return {
    title: t("error.title"),
  };
}

export default async function AuthErrorPage({
  params,
  searchParams,
}: AuthErrorPageProps) {
  const [{ locale }, { error, provider }] = await Promise.all([
    params,
    searchParams,
  ]);
  const t = await getTranslations({ locale, namespace: "auth" });
  const errorMessage = provider
    ? `${error ?? "unknown"} (${provider})`
    : error ?? "unknown";

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader className="space-y-2 text-center">
        <CardTitle>{t("error.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-center text-sm">
          {errorMessage}
        </p>
        <div className="grid gap-3">
          <a
            className="bg-primary text-primary-foreground inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium"
            href={`/${locale}/auth/sign-in`}
          >
            {t("error.tryAgain")}
          </a>
          <a
            className="border-input bg-background inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium"
            href={`/${locale}/auth/sign-in`}
          >
            {t("error.emailAlternative")}
          </a>
          <a
            className="text-primary text-center text-sm font-medium"
            href={`/${locale}`}
          >
            {t("error.returnHome")}
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
