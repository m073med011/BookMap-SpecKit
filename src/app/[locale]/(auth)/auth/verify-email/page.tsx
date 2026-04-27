import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { EmailVerificationForm } from "@/features/auth/components/EmailVerificationForm";
import type { Locale } from "@/types";

type VerifyEmailPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: VerifyEmailPageProps): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "auth" });

  return {
    title: t("verifyEmail.title"),
  };
}

export default async function VerifyEmailPage({
  params,
}: VerifyEmailPageProps) {
  const locale = (await params).locale as Locale;

  return <EmailVerificationForm locale={locale} />;
}
