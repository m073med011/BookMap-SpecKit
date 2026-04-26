import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SignUpForm } from "@/features/auth/components/SignUpForm";
import type { Locale } from "@/types";

type SignUpPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: SignUpPageProps): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "auth" });

  return {
    title: t("signUp.title"),
  };
}

export default async function SignUpPage({ params }: SignUpPageProps) {
  const locale = (await params).locale as Locale;

  return <SignUpForm locale={locale} />;
}
