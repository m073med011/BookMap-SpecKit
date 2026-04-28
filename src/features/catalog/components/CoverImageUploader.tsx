"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useTransition } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@/components/ui";
import { toast } from "@/lib/utils/toast";
import { uploadCoverImageAction } from "../actions/media";

type CoverImageUploaderProps = {
  bookId: string;
  currentUrl: string | null;
  libraryId: string;
};

export function CoverImageUploader({
  bookId,
  currentUrl,
  libraryId,
}: CoverImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleUpload() {
    if (!selectedFile) {
      toast.error("Select a cover image first.");
      return;
    }

    const payload = new FormData();
    payload.set("bookId", bookId);
    payload.set("file", selectedFile);
    payload.set("libraryId", libraryId);

    startTransition(async () => {
      const result = await uploadCoverImageAction(payload);

      if ("success" in result && result.success) {
        setPreviewUrl(result.url);
        setSelectedFile(null);
        toast.success("Cover uploaded.");
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
        <CardTitle>Cover image</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {previewUrl ? (
          <img
            alt="Book cover"
            className="aspect-[3/4] w-40 rounded-md border object-cover"
            src={previewUrl}
          />
        ) : (
          <div className="bg-muted flex aspect-[3/4] w-40 items-center justify-center rounded-md border text-sm text-muted-foreground">
            No cover
          </div>
        )}
        <Input
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) =>
            setSelectedFile(event.target.files?.[0] ?? null)
          }
          type="file"
        />
        <Button loading={isPending} onClick={handleUpload} type="button">
          Upload cover
        </Button>
      </CardContent>
    </Card>
  );
}
