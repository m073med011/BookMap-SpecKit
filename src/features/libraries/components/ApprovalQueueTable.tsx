"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from "@/components/ui";
import { StatusBadge } from "@/components/ui/feedback/StatusBadge";
import { useRouter } from "@/lib/i18n/routing";
import { toast } from "@/lib/utils/toast";
import type { Library } from "../types";
import { approveLibraryAction } from "../actions/approve-library";
import { rejectLibraryAction } from "../actions/reject-library";

type ApprovalLibrary = Library & {
  ownerDisplayName?: string | null;
};

type ApprovalQueueTableProps = {
  libraries: ApprovalLibrary[];
  locale: string;
};

export function ApprovalQueueTable({
  libraries,
  locale,
}: ApprovalQueueTableProps) {
  const router = useRouter();
  const t = useTranslations("libraries.approvalQueue");
  const libraryT = useTranslations("libraries");
  const commonT = useTranslations("common");
  const [selectedLibrary, setSelectedLibrary] = useState<ApprovalLibrary | null>(
    null,
  );
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
      }),
    [locale],
  );

  function handleApprove(libraryId: string) {
    startTransition(async () => {
      const result = await approveLibraryAction({ libraryId });

      if ("success" in result && result.success) {
        toast.success(t("approved"));
        router.refresh();
        return;
      }

      if ("error" in result) {
        toast.error(
          result.code === "OWNER_SUSPENDED"
            ? t("ownerSuspended")
            : result.error,
        );
      }
    });
  }

  function handleReject() {
    if (!selectedLibrary) {
      return;
    }

    if (!reason.trim()) {
      toast.error(t("rejectReasonRequired"));
      return;
    }

    startTransition(async () => {
      const result = await rejectLibraryAction({
        action: "reject",
        libraryId: selectedLibrary.id,
        reason,
      });

      if ("success" in result && result.success) {
        toast.success(t("rejected"));
        setReason("");
        setSelectedLibrary(null);
        router.refresh();
        return;
      }

      if ("error" in result) {
        toast.error(result.error);
      }
    });
  }

  if (libraries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-8 text-center">
        <p className="text-lg font-semibold">{t("noLibraries")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("libraryName")}</TableHead>
              <TableHead>{t("owner")}</TableHead>
              <TableHead>{t("submittedDate")}</TableHead>
              <TableHead>{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {libraries.map((library) => (
              <TableRow key={library.id}>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium">{library.name}</p>
                    <p className="text-muted-foreground text-xs">
                      /libraries/{library.slug}
                    </p>
                    <StatusBadge
                      label={libraryT(`status.${library.status}`)}
                      variant="warning"
                    />
                  </div>
                </TableCell>
                <TableCell>{library.ownerDisplayName || library.ownerId}</TableCell>
                <TableCell>{dateFormatter.format(new Date(library.updatedAt))}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      loading={isPending}
                      onClick={() => handleApprove(library.id)}
                      size="sm"
                      type="button"
                    >
                      {t("approve")}
                    </Button>
                    <Button
                      onClick={() => setSelectedLibrary(library)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      {t("reject")}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setSelectedLibrary(null);
            setReason("");
          }
        }}
        open={Boolean(selectedLibrary)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("confirmReject")}</DialogTitle>
            <DialogDescription>
              {selectedLibrary?.name}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            label={t("rejectReason")}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t("rejectReasonPlaceholder")}
            value={reason}
          />
          <DialogFooter>
            <Button
              onClick={() => {
                setSelectedLibrary(null);
                setReason("");
              }}
              type="button"
              variant="outline"
            >
              {commonT("cancel")}
            </Button>
            <Button loading={isPending} onClick={handleReject} type="button">
              {t("reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
