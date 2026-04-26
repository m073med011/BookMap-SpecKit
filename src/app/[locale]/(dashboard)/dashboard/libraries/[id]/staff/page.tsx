import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { hasRole } from "@/lib/auth/permissions";
import { getMembership } from "@/features/libraries/services/library-staff-service";
import { getLibrary } from "@/features/libraries/services/library-service";
import { getCurrentUserWithRoles } from "@/features/roles/services/authorize";
import type { Locale } from "@/types";

type LibraryStaffPlaceholderPageProps = {
  params: Promise<{ id: string; locale: string }>;
};

export default async function LibraryStaffPlaceholderPage({
  params,
}: LibraryStaffPlaceholderPageProps) {
  const { id, locale } = await params;
  const { roles, user } = await getCurrentUserWithRoles();

  if (!user) {
    redirect(`/${locale}/auth/sign-in`);
  }

  const library = await getLibrary(id);

  if (!library) {
    notFound();
  }

  const membership = await getMembership(id, user.id);
  const isAdmin = hasRole(roles, "admin") || hasRole(roles, "superadmin");

  if (!membership && !isAdmin) {
    redirect(`/${locale}/dashboard`);
  }

  const commonT = await getTranslations({ locale: locale as Locale, namespace: "common" });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{commonT("comingSoon")}</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground text-sm">
        Library staff management for <strong>{library.name}</strong> is staged next.
      </CardContent>
    </Card>
  );
}
