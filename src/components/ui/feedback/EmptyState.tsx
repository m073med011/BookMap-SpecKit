"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/form/Button";

type EmptyStateProps = {
  action?: {
    label: string;
    onClick: () => void;
  };
  description?: string;
  icon?: ReactNode;
  title?: string;
};

export function EmptyState({
  action,
  description,
  icon,
  title,
}: EmptyStateProps) {
  const t = useTranslations("empty");
  const resolvedTitle = title ?? t("title");
  const resolvedDescription = description ?? t("description");

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
      {icon ? (
        <div className="text-muted-foreground text-4xl" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{resolvedTitle}</h3>
        <p className="text-muted-foreground max-w-lg text-sm">
          {resolvedDescription}
        </p>
      </div>
      {action ? (
        <Button onClick={action.onClick} type="button" variant="outline">
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
