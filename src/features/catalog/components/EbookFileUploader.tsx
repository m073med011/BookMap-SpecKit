"use client";

import { useState, useTransition } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@/components/ui";
import { toast } from "@/lib/utils/toast";
import { uploadEbookFileAction } from "../actions/media";

type EbookFileUploaderProps = {
  currentPath: string | null;
  libraryId: string;
  listingFormatId: string;
};

export function EbookFileUploader({
  currentPath,
  libraryId,
  listingFormatId,
}: EbookFileUploaderProps) {
  const [path, setPath] = useState<string | null>(currentPath);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleUpload() {
    if (!selectedFile) {
      toast.error("Select an ebook file first.");
      return;
    }

    const payload = new FormData();
    payload.set("file", selectedFile);
    payload.set("libraryId", libraryId);
    payload.set("listingFormatId", listingFormatId);

    startTransition(async () => {
      const result = await uploadEbookFileAction(payload);

      if ("success" in result && result.success) {
        setPath(result.path);
        setSelectedFile(null);
        toast.success("Ebook uploaded.");
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
        <CardTitle>Ebook file</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="break-all rounded-md border bg-muted/40 p-3 text-sm">
          {path ?? "No file uploaded"}
        </p>
        <Input
          accept="application/pdf,application/epub+zip,.epub"
          onChange={(event) =>
            setSelectedFile(event.target.files?.[0] ?? null)
          }
          type="file"
        />
        <Button loading={isPending} onClick={handleUpload} type="button">
          Upload ebook
        </Button>
      </CardContent>
    </Card>
  );
}
