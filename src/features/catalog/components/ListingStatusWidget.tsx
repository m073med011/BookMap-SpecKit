"use client";

import { useState, useTransition } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, StatusBadge } from "@/components/ui";
import { toast } from "@/lib/utils/toast";
import { useRouter } from "@/lib/i18n/routing";
import { updateListingStatusAction } from "../actions/listings";
import type { ListingStatus } from "../schemas";

type ListingStatusWidgetProps = {
  ebookFilesReady: boolean;
  hasCover: boolean;
  listingId: string;
  status: ListingStatus;
};

const nextStatusByStatus: Partial<Record<ListingStatus, ListingStatus>> = {
  draft: "pending_review",
  pending_review: "published",
  published: "unpublished",
  unpublished: "archived",
};

const actionLabelByStatus: Partial<Record<ListingStatus, string>> = {
  draft: "Submit",
  pending_review: "Publish",
  published: "Unpublish",
  unpublished: "Archive",
};

function badgeVariant(status: ListingStatus) {
  if (status === "published") {
    return "success" as const;
  }

  if (status === "pending_review") {
    return "warning" as const;
  }

  if (status === "archived" || status === "unpublished") {
    return "default" as const;
  }

  return "info" as const;
}

export function ListingStatusWidget({
  ebookFilesReady,
  hasCover,
  listingId,
  status,
}: ListingStatusWidgetProps) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<ListingStatus>(status);
  const [isPending, startTransition] = useTransition();
  const nextStatus = nextStatusByStatus[currentStatus];
  const publishBlocked =
    nextStatus === "published" && (!hasCover || !ebookFilesReady);

  function handleTransition() {
    if (!nextStatus) {
      return;
    }

    if (publishBlocked) {
      toast.error("Upload required media before publishing.");
      return;
    }

    startTransition(async () => {
      const result = await updateListingStatusAction({
        listing_id: listingId,
        new_status: nextStatus,
      });

      if ("success" in result && result.success) {
        setCurrentStatus(result.status);
        toast.success(`Listing is now ${result.status.replace("_", " ")}.`);
        router.refresh();
        return;
      }

      if ("error" in result) {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lifecycle</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        <StatusBadge
          label={currentStatus.replace("_", " ")}
          variant={badgeVariant(currentStatus)}
        />
        {nextStatus ? (
          <Button
            disabled={publishBlocked}
            loading={isPending}
            onClick={handleTransition}
            type="button"
          >
            {actionLabelByStatus[currentStatus]}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
