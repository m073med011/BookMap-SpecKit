import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/routing";

export default async function LocaleNotFoundPage() {
  const t = await getTranslations("errors");
  const common = await getTranslations("common");

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-primary/80 text-7xl font-black">404</p>
      <h1 className="text-3xl font-semibold">{t("notFound")}</h1>
      <p className="text-muted-foreground max-w-xl">
        {t("notFoundDescription")}
      </p>
      <Link
        className="bg-primary text-primary-foreground inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium"
        href="/"
      >
        {common("backToHome")}
      </Link>
    </div>
  );
}
