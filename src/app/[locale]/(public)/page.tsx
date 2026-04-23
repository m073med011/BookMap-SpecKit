import { getTranslations } from "next-intl/server";

export default async function HomePage() {
  const t = await getTranslations("common");

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <h1 className="text-4xl font-bold tracking-tight">{t("appName")}</h1>
      <p className="text-muted-foreground max-w-2xl text-lg">{t("tagline")}</p>
      <div className="border-border bg-card text-card-foreground rounded-full border px-4 py-2 text-sm">
        {t("comingSoon")}
      </div>
    </section>
  );
}
