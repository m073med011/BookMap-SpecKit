import { getTranslations } from "next-intl/server";
import { StatusBadge } from "@/components/ui";
import type { LibraryStatus } from "../types";

type LibraryStatusBadgeProps = {
  status: LibraryStatus;
};

const variantByStatus: Record<
  LibraryStatus,
  "default" | "error" | "success" | "warning"
> = {
  draft: "default",
  pending_approval: "warning",
  active: "success",
  suspended: "error",
  rejected: "error",
  archived: "default",
};

export async function LibraryStatusBadge({
  status,
}: LibraryStatusBadgeProps) {
  const t = await getTranslations("libraries");

  return (
    <StatusBadge label={t(`status.${status}`)} variant={variantByStatus[status]} />
  );
}
