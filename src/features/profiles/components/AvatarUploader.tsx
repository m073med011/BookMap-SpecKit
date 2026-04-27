"use client";

import { startTransition, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import { toast } from "@/lib/utils/toast";
import {
  AVATAR_ALLOWED_MIME_TYPES,
  AVATAR_MAX_SIZE_BYTES,
} from "@/features/profiles/schemas/profile";
import {
  removeAvatarAction,
  uploadAvatarAction,
} from "@/features/profiles/actions/avatar";

type AvatarUploaderProps = {
  currentAvatarUrl: string | null;
};

export function AvatarUploader({ currentAvatarUrl }: AvatarUploaderProps) {
  const t = useTranslations("profile");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (file: File | null) => {
    if (!file) {
      return;
    }

    if (file.size > AVATAR_MAX_SIZE_BYTES) {
      toast.error(t("avatar.errors.tooLarge"));
      return;
    }

    if (
      !AVATAR_ALLOWED_MIME_TYPES.includes(
        file.type as (typeof AVATAR_ALLOWED_MIME_TYPES)[number],
      )
    ) {
      toast.error(t("avatar.errors.invalidType"));
      return;
    }

    const formData = new FormData();
    formData.set("file", file);

    startTransition(async () => {
      setIsUploading(true);
      const result = await uploadAvatarAction(formData);
      setIsUploading(false);

      if ("error" in result) {
        toast.error(t("avatar.errors.uploadFailed"));
        return;
      }

      setAvatarUrl(result.avatarUrl);
    });
  };

  const handleRemove = () => {
    startTransition(async () => {
      setIsUploading(true);
      await removeAvatarAction();
      setIsUploading(false);
      setAvatarUrl(null);
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">{t("avatar.title")}</h2>
      </div>
      <div className="flex items-center gap-4">
        <div className="bg-muted text-muted-foreground flex h-20 w-20 items-center justify-center overflow-hidden rounded-full text-sm font-medium">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={t("avatar.title")}
              className="h-full w-full object-cover"
              src={avatarUrl}
            />
          ) : (
            t("avatar.placeholder")
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <input
            accept={AVATAR_ALLOWED_MIME_TYPES.join(",")}
            className="hidden"
            onChange={(event) =>
              handleFileChange(event.target.files?.[0] ?? null)
            }
            ref={inputRef}
            type="file"
          />
          <Button
            loading={isUploading}
            onClick={() => inputRef.current?.click()}
            type="button"
            variant="outline"
          >
            {isUploading ? t("avatar.uploading") : t("avatar.uploadButton")}
          </Button>
          {avatarUrl ? (
            <Button onClick={handleRemove} type="button" variant="ghost">
              {t("avatar.removeButton")}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
