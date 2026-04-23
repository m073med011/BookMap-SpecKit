import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";
import type { Locale } from "@/types";

type ResetPasswordPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ code?: string }>;
};

export async function generateMetadata({
  params,
}: ResetPasswordPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });

  return {
    title: t("resetPassword.title"),
  };
}

export default async function ResetPasswordPage({
  params,
  searchParams,
}: ResetPasswordPageProps) {
  const [{ locale }, { code }] = await Promise.all([params, searchParams]);

  if (!code) {
    redirect(`/${locale}/auth/forgot-password`);
  }

  return <ResetPasswordForm code={code} locale={locale} />;
}
