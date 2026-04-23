import { getTranslations } from "next-intl/server";

export async function Footer() {
  const t = await getTranslations("footer");

  return (
    <footer className="bg-background text-muted-foreground border-t py-6 ps-4 pe-4 text-center text-sm">
      <p>{t("copyright", { year: 2026 })}</p>
    </footer>
  );
}
