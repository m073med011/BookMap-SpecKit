import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";
import type { Locale } from "@/types";

type ForgotPasswordPageProps = {
  params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({
  params,
}: ForgotPasswordPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });

  return {
    title: t("forgotPassword.title"),
  };
}

export default async function ForgotPasswordPage({
  params,
}: ForgotPasswordPageProps) {
  const { locale } = await params;

  return <ForgotPasswordForm locale={locale} />;
}
