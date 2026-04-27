"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/features/auth/services/audit-service";
import { requireLibraryStaff } from "@/features/roles/services/authorize";
import type { Database } from "@/types/supabase";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  assetUploadSchema,
  BANNER_MAX_SIZE_BYTES,
  LOGO_MAX_SIZE_BYTES,
} from "../schemas/library";

function getExtension(mimeType: string) {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return null;
  }
}

export async function uploadLibraryAssetAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      code: "UNAUTHORIZED",
      error: "You must be signed in.",
    };
  }

  const libraryId = formData.get("libraryId");
  const type = formData.get("type");
  const file = formData.get("file");

  if (typeof libraryId !== "string" || !(file instanceof File)) {
    return {
      code: "INVALID_INPUT",
      error: "Invalid asset upload payload.",
    };
  }

  try {
    await requireLibraryStaff(libraryId);
  } catch {
    return {
      code: "UNAUTHORIZED",
      error: "You do not have permission to upload assets for this library.",
    };
  }

  const validation = assetUploadSchema.safeParse({ type });

  if (!validation.success) {
    return {
      code: "INVALID_INPUT",
      error: validation.error.issues[0]?.message ?? "Invalid asset type.",
    };
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
    return {
      code: "INVALID_FILE_TYPE",
      error: "Unsupported file type.",
    };
  }

  const maxSize =
    validation.data.type === "logo"
      ? LOGO_MAX_SIZE_BYTES
      : BANNER_MAX_SIZE_BYTES;

  if (file.size > maxSize) {
    return {
      code: "FILE_TOO_LARGE",
      error: "The selected file is too large.",
    };
  }

  const extension = getExtension(file.type);

  if (!extension) {
    return {
      code: "INVALID_FILE_TYPE",
      error: "Unsupported file type.",
    };
  }

  const path = `${libraryId}/${validation.data.type}/${validation.data.type}.${extension}`;
  const serviceSupabase = createServiceRoleClient();
  const { error: uploadError } = await serviceSupabase.storage
    .from("library-assets")
    .upload(path, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return {
      code: "UPLOAD_FAILED",
      error: uploadError.message,
    };
  }

  const { data: publicUrlData } = serviceSupabase.storage
    .from("library-assets")
    .getPublicUrl(path);

  const updatePayload: Database["public"]["Tables"]["libraries"]["Update"] =
    validation.data.type === "logo"
      ? { logo_url: publicUrlData.publicUrl }
      : { banner_url: publicUrlData.publicUrl };
  const { error: updateError } = await serviceSupabase
    .from("libraries")
    .update(updatePayload)
    .eq("id", libraryId);

  if (updateError) {
    return {
      code: "UPLOAD_FAILED",
      error: updateError.message,
    };
  }

  await logAuditEvent({
    action: "library_asset_uploaded",
    metadata: {
      assetType: validation.data.type,
      libraryId,
      url: publicUrlData.publicUrl,
    },
    targetId: libraryId,
    targetType: "library",
    userId: user.id,
  });

  return {
    success: true,
    url: publicUrlData.publicUrl,
  };
}
