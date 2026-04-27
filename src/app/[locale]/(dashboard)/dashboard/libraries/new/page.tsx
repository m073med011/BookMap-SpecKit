import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/features/libraries/components/OnboardingWizard";
import { getLibrary } from "@/features/libraries/services/library-service";
import { getCurrentUserWithRoles } from "@/features/roles/services/authorize";
import type { Locale } from "@/types";

type LibrariesNewPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ draft?: string }>;
};

export default async function LibrariesNewPage({
  params,
  searchParams,
}: LibrariesNewPageProps) {
  const locale = (await params).locale as Locale;
  const { user } = await getCurrentUserWithRoles();
  if (!user) {
    redirect(`/${locale}/auth/sign-in`);
  }
  const draftId = (await searchParams).draft;
  const t = await getTranslations({ locale, namespace: "libraries" });

  let draftLibrary = null;

  if (draftId) {
    const candidate = await getLibrary(draftId);

    if (
      candidate &&
      candidate.ownerId === user.id &&
      candidate.status === "draft"
    ) {
      draftLibrary = candidate;
    } else {
      redirect(`/${locale}/dashboard/libraries`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">{t("createLibrary")}</h1>
        <p className="text-muted-foreground">{t("pendingApproval")}</p>
      </div>
      <OnboardingWizard library={draftLibrary} locale={locale} />
    </div>
  );
}
