import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SignInForm } from "@/features/auth/components/SignInForm";
import type { Locale } from "@/types";

type SignInPageProps = {
  params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({
  params,
}: SignInPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });

  return {
    title: t("signIn.title"),
  };
}

export default async function SignInPage({ params }: SignInPageProps) {
  const { locale } = await params;

  return <SignInForm locale={locale} />;
}
