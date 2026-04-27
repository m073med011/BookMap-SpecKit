/* eslint-disable @next/next/no-img-element */
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Link } from "@/lib/i18n/routing";
import { hasRole } from "@/lib/auth/permissions";
import { LibraryStatusBadge } from "@/features/libraries/components/LibraryStatusBadge";
import { resubmitLibraryAction } from "@/features/libraries/actions/resubmit-library";
import { getMembership } from "@/features/libraries/services/library-staff-service";
import { getLibrary, getStatusHistory } from "@/features/libraries/services/library-service";
import { getCurrentUserWithRoles } from "@/features/roles/services/authorize";
import type { Locale } from "@/types";

type LibraryOverviewPageProps = {
  params: Promise<{ id: string; locale: string }>;
};

export default async function LibraryOverviewPage({
  params,
}: LibraryOverviewPageProps) {
  const { id, locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "libraries" });
  const { roles, user } = await getCurrentUserWithRoles();
  if (!user) {
    redirect(`/${locale}/auth/sign-in`);
  }

  const libraryRecord = await getLibrary(id);

  if (!libraryRecord) {
    notFound();
  }

  const library = libraryRecord;
  const membership = await getMembership(id, user.id);
  const isAdmin = hasRole(roles, "admin") || hasRole(roles, "superadmin");

  if (!membership && !isAdmin) {
    redirect(`/${locale}/dashboard`);
  }

  const statusHistory =
    library.status === "rejected" ? await getStatusHistory(library.id) : [];
  const rejectionEntry = statusHistory.find(
    (entry) => entry.newStatus === "rejected",
  );

  async function handleResubmit() {
    "use server";

    await resubmitLibraryAction({ libraryId: library.id });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <CardTitle>{library.name}</CardTitle>
            <LibraryStatusBadge status={library.status} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`/dashboard/libraries/${library.id}/settings`}>
                Settings
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={`/dashboard/libraries/${library.id}/staff`}>
                Staff
              </Link>
            </Button>
            {library.status === "draft" ? (
              <Button asChild size="sm">
                <Link href={`/dashboard/libraries/new?draft=${library.id}`}>
                  {t("continueEditing")}
                </Link>
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="from-primary/20 to-primary/5 overflow-hidden rounded-3xl border bg-gradient-to-br">
            {library.bannerUrl ? (
              <img
                alt={t("banner")}
                className="h-52 w-full object-cover"
                src={library.bannerUrl}
              />
            ) : (
              <div className="h-52 w-full" />
            )}
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {library.logoUrl ? (
              <img
                alt={t("logo")}
                className="h-24 w-24 rounded-3xl border object-cover"
                src={library.logoUrl}
              />
            ) : (
              <div className="bg-muted flex h-24 w-24 items-center justify-center rounded-3xl border text-sm">
                {t("logo")}
              </div>
            )}

            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">
                /libraries/{library.slug}
              </p>
              <p className="max-w-3xl text-sm leading-6">
                {library.description || "-"}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border p-4">
              <p className="text-muted-foreground text-xs">{t("contactEmail")}</p>
              <p>{library.contactEmail || "-"}</p>
            </div>
            <div className="rounded-2xl border p-4">
              <p className="text-muted-foreground text-xs">{t("contactPhone")}</p>
              <p>{library.contactPhone || "-"}</p>
            </div>
            <div className="rounded-2xl border p-4 sm:col-span-2">
              <p className="text-muted-foreground text-xs">{t("address")}</p>
              <p className="whitespace-pre-wrap">{library.address || "-"}</p>
            </div>
            <div className="rounded-2xl border p-4 sm:col-span-2">
              <p className="text-muted-foreground text-xs">{t("languages")}</p>
              <p>{library.languages.join(", ").toUpperCase()}</p>
            </div>
          </div>

          {library.status === "rejected" ? (
            <div className="space-y-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
              <div>
                <p className="text-sm font-semibold">{t("rejectionReason")}</p>
                <p className="text-sm">{rejectionEntry?.reason || "-"}</p>
              </div>
              <form action={handleResubmit}>
                <Button type="submit">{t("resubmit")}</Button>
              </form>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
