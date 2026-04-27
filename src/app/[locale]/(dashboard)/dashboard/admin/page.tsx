import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Link } from "@/lib/i18n/routing";
import { getLibrariesByStatus } from "@/features/libraries/services/library-service";
import { requireRole } from "@/features/roles/services/authorize";
import type { Locale } from "@/types";

type AdminDashboardPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminDashboardPage({
  params,
}: AdminDashboardPageProps) {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "libraries.approvalQueue" });

  try {
    await requireRole("admin");
  } catch {
    redirect(`/${locale}/dashboard`);
  }

  const pendingCount = (await getLibrariesByStatus("pending_approval")).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">
          {pendingCount} pending libraries
        </p>
        <Link
          className="text-primary text-sm font-medium underline-offset-4 hover:underline"
          href="/dashboard/admin/approvals"
        >
          {t("title")}
        </Link>
      </CardContent>
    </Card>
  );
}
