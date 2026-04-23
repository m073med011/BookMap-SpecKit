import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/routing";
import { HeaderActions } from "./HeaderActions";

export async function Header() {
  const t = await getTranslations("common");

  return (
    <header className="bg-background/95 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="flex items-center justify-between py-3 ps-4 pe-4">
        <Link className="text-lg font-semibold tracking-tight" href="/">
          {t("appName")}
        </Link>
        <nav aria-label="Primary" className="flex-1" />
        <HeaderActions />
      </div>
    </header>
  );
}
