import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { ApprovalQueueTable } from "@/features/libraries/components/ApprovalQueueTable";
import { getLibrariesByStatus } from "@/features/libraries/services/library-service";
import { requireRole } from "@/features/roles/services/authorize";
import { getProfile } from "@/features/profiles/services/profile-service";
import type { Locale } from "@/types";

type ApprovalQueuePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ApprovalQueuePage({
  params,
}: ApprovalQueuePageProps) {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "libraries.approvalQueue" });

  try {
    await requireRole("admin");
  } catch {
    redirect(`/${locale}/dashboard`);
  }

  const libraries = await getLibrariesByStatus("pending_approval");
  const librariesWithOwners = await Promise.all(
    libraries.map(async (library) => {
      const ownerProfile = await getProfile(library.ownerId);
      return {
        ...library,
        ownerDisplayName: ownerProfile?.displayName ?? null,
      };
    }),
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("noLibraries")}</p>
      </div>
      <ApprovalQueueTable libraries={librariesWithOwners} locale={locale} />
    </div>
  );
}
