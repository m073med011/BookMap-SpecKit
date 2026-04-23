import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { AvatarUploader } from "@/features/profiles/components/AvatarUploader";
import { ProfileSettingsForm } from "@/features/profiles/components/ProfileSettingsForm";
import { getProfile } from "@/features/profiles/services/profile-service";
import type { Locale } from "@/types";

type ProfilePageProps = {
  params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profile" });

  return {
    title: t("settings.title"),
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/sign-in`);
  }

  const profile = await getProfile(user.id);

  if (!profile) {
    redirect(`/${locale}/dashboard`);
  }

  const t = await getTranslations({ locale, namespace: "profile" });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <AvatarUploader currentAvatarUrl={profile.avatarUrl} />
          <ProfileSettingsForm locale={locale} profile={profile} />
        </CardContent>
      </Card>
    </div>
  );
}
