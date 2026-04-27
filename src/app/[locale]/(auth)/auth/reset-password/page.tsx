import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";
import type { Locale } from "@/types";

type ResetPasswordPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ code?: string }>;
};

export async function generateMetadata({
  params,
}: ResetPasswordPageProps): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "auth" });

  return {
    title: t("resetPassword.title"),
  };
}

export default async function ResetPasswordPage({
  params,
  searchParams,
}: ResetPasswordPageProps) {
  const [{ locale: requestedLocale }, { code }] = await Promise.all([
    params,
    searchParams,
  ]);
  const locale = requestedLocale as Locale;

  if (!code) {
    redirect(`/${locale}/auth/forgot-password`);
  }

  return <ResetPasswordForm code={code} locale={locale} />;
}
