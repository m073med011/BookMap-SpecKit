import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle, StatusBadge } from "@/components/ui";
import { Link } from "@/lib/i18n/routing";
import { getLibrariesForUser } from "@/features/libraries/services/library-service";
import { getCurrentUserWithRoles } from "@/features/roles/services/authorize";
import type { Locale } from "@/types";

type MyLibrariesPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function MyLibrariesPage({
  params,
}: MyLibrariesPageProps) {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "libraries.myLibraries" });
  const libraryT = await getTranslations({ locale, namespace: "libraries" });
  const { user } = await getCurrentUserWithRoles();
  if (!user) {
    return null;
  }
  const libraries = await getLibrariesForUser(user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("noLibrariesDescription")}</p>
        </div>
        <Link
          className="bg-primary text-primary-foreground inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium"
          href="/dashboard/libraries/new"
        >
          {t("createNew")}
        </Link>
      </div>

      {libraries.length === 0 ? (
        <Card>
          <CardContent className="space-y-2 p-8 text-center">
            <p className="text-lg font-semibold">{t("noLibraries")}</p>
            <p className="text-muted-foreground">{t("noLibrariesDescription")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {libraries.map((library) => (
            <Card key={library.id}>
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>{library.name}</CardTitle>
                  <StatusBadge
                    label={libraryT(`status.${library.status}`)}
                    variant={
                      library.status === "active"
                        ? "success"
                        : library.status === "pending_approval"
                          ? "warning"
                          : library.status === "rejected" || library.status === "suspended"
                            ? "error"
                            : "default"
                    }
                  />
                </div>
                <p className="text-muted-foreground text-sm">
                  {t("yourRole")}: {library.role === "owner" ? t("owner") : t("staff")}
                </p>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3">
                <p className="text-muted-foreground line-clamp-2 text-sm">
                  {library.description || `/libraries/${library.slug}`}
                </p>
                <Link
                  className="text-primary text-sm font-medium underline-offset-4 hover:underline"
                  href={`/dashboard/libraries/${library.id}`}
                >
                  {t("manage")}
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
