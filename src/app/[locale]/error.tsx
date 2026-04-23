"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/routing";

type LocaleErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function LocaleErrorPage({
  error,
  reset,
}: LocaleErrorPageProps) {
  const t = useTranslations();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-semibold">{t("errors.sectionError")}</h1>
      <p className="text-muted-foreground max-w-xl">
        {t("errors.sectionErrorDescription")}
      </p>
      <p className="text-muted-foreground text-sm">{error.message}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          className="bg-primary text-primary-foreground inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium"
          onClick={reset}
          type="button"
        >
          {t("common.retry")}
        </button>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium"
          href="/"
        >
          {t("common.backToHome")}
        </Link>
      </div>
    </div>
  );
}
