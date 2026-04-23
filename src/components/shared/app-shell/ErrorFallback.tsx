"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";

type ErrorFallbackProps = {
  error: Error;
  reset: () => void;
  sectionName?: string;
};

export function ErrorFallback({
  error,
  reset,
  sectionName,
}: ErrorFallbackProps) {
  const t = useTranslations("errors");
  const common = useTranslations("common");

  return (
    <div
      className={cn(
        "border-destructive/20 bg-destructive/5 rounded-lg border p-6 text-center",
        "flex flex-col items-center gap-3",
      )}
      role="alert"
    >
      <span aria-hidden="true" className="text-3xl">
        !
      </span>
      <div className="space-y-1">
        <h2 className="text-foreground text-lg font-semibold">
          {t("sectionError")}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t("sectionErrorDescription")}
        </p>
        {sectionName ? (
          <p className="text-muted-foreground/80 text-xs">{sectionName}</p>
        ) : null}
      </div>
      <button
        className="border-destructive/20 bg-background text-foreground hover:bg-accent hover:text-accent-foreground inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium transition-colors"
        onClick={reset}
        type="button"
      >
        {common("retry")}
      </button>
      <p className="text-muted-foreground max-w-md text-xs">{error.message}</p>
    </div>
  );
}
