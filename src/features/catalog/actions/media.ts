"use server";

import { logAuditEvent } from "@/features/auth/services/audit-service";
import { requireLibraryStaff } from "@/features/roles/services/authorize";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import {
  catalogAssetUploadSchema,
  CATALOG_COVER_MAX_SIZE_BYTES,
  CATALOG_COVER_MIME_TYPES,
  CATALOG_EBOOK_MAX_SIZE_BYTES,
  CATALOG_EBOOK_MIME_TYPES,
} from "../schemas";

type ActionError = {
  code: string;
  error: string;
};

type CoverUploadSuccess = {
  path: string;
  success: true;
  url: string;
};

type EbookUploadSuccess = {
  path: string;
  success: true;
};

function imageExtension(mimeType: string): "jpg" | "png" | "webp" | null {
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

function ebookExtension(mimeType: string): "pdf" | "epub" | null {
  switch (mimeType) {
    case "application/pdf":
      return "pdf";
    case "application/epub+zip":
      return "epub";
    default:
      return null;
  }
}

function getRequiredString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function getAuthenticatedUserId(): Promise<
  { userId: string } | ActionError
> {
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

  return { userId: user.id };
}

export async function uploadCoverImageAction(
  formData: FormData,
): Promise<CoverUploadSuccess | ActionError> {
  const auth = await getAuthenticatedUserId();

  if ("error" in auth) {
    return auth;
  }

  const libraryId = getRequiredString(formData, "libraryId");
  const bookId = getRequiredString(formData, "bookId");
  const file = formData.get("file");
  const validation = catalogAssetUploadSchema.safeParse({
    bookId,
    libraryId,
  });

  if (!validation.success || !(file instanceof File)) {
    return {
      code: "INVALID_INPUT",
      error: "Invalid cover upload payload.",
    };
  }

  if (!validation.data.bookId) {
    return {
      code: "INVALID_INPUT",
      error: "Book ID is required.",
    };
  }

  try {
    await requireLibraryStaff(validation.data.libraryId);
  } catch {
    return {
      code: "UNAUTHORIZED",
      error: "You do not have permission to upload covers for this library.",
    };
  }

  if (!CATALOG_COVER_MIME_TYPES.includes(file.type as (typeof CATALOG_COVER_MIME_TYPES)[number])) {
    return {
      code: "INVALID_FILE_TYPE",
      error: "Cover images must be JPEG, PNG, or WebP.",
    };
  }

  if (file.size > CATALOG_COVER_MAX_SIZE_BYTES) {
    return {
      code: "FILE_TOO_LARGE",
      error: "Cover images must be 5 MB or smaller.",
    };
  }

  const extension = imageExtension(file.type);

  if (!extension) {
    return {
      code: "INVALID_FILE_TYPE",
      error: "Unsupported cover image type.",
    };
  }

  const serviceSupabase = createServiceRoleClient();
  const { data: book, error: bookError } = await serviceSupabase
    .from("books")
    .select("id, cover_image_path, library_id")
    .eq("id", validation.data.bookId)
    .eq("library_id", validation.data.libraryId)
    .maybeSingle();

  if (bookError || !book) {
    return {
      code: "NOT_FOUND",
      error: "Book not found.",
    };
  }

  const path = `${validation.data.libraryId}/${validation.data.bookId}/cover.${extension}`;
  const { error: uploadError } = await serviceSupabase.storage
    .from("book_covers")
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

  const { error: updateError } = await serviceSupabase
    .from("books")
    .update({ cover_image_path: path })
    .eq("id", book.id);

  if (updateError) {
    return {
      code: "UPLOAD_FAILED",
      error: updateError.message,
    };
  }

  if (book.cover_image_path && book.cover_image_path !== path) {
    await serviceSupabase.storage
      .from("book_covers")
      .remove([book.cover_image_path]);
  }

  const { data: publicUrl } = serviceSupabase.storage
    .from("book_covers")
    .getPublicUrl(path);

  await logAuditEvent({
    action: "catalog_cover_uploaded",
    metadata: {
      libraryId: validation.data.libraryId,
      path,
    },
    targetId: book.id,
    targetType: "book",
    userId: auth.userId,
  });

  return {
    path,
    success: true,
    url: publicUrl.publicUrl,
  };
}

export async function uploadEbookFileAction(
  formData: FormData,
): Promise<EbookUploadSuccess | ActionError> {
  const auth = await getAuthenticatedUserId();

  if ("error" in auth) {
    return auth;
  }

  const libraryId = getRequiredString(formData, "libraryId");
  const listingFormatId = getRequiredString(formData, "listingFormatId");
  const file = formData.get("file");
  const validation = catalogAssetUploadSchema.safeParse({
    libraryId,
    listingFormatId,
  });

  if (!validation.success || !(file instanceof File)) {
    return {
      code: "INVALID_INPUT",
      error: "Invalid ebook upload payload.",
    };
  }

  if (!validation.data.listingFormatId) {
    return {
      code: "INVALID_INPUT",
      error: "Listing format ID is required.",
    };
  }

  try {
    await requireLibraryStaff(validation.data.libraryId);
  } catch {
    return {
      code: "UNAUTHORIZED",
      error: "You do not have permission to upload ebooks for this library.",
    };
  }

  if (!CATALOG_EBOOK_MIME_TYPES.includes(file.type as (typeof CATALOG_EBOOK_MIME_TYPES)[number])) {
    return {
      code: "INVALID_FILE_TYPE",
      error: "Ebook files must be PDF or EPUB.",
    };
  }

  if (file.size > CATALOG_EBOOK_MAX_SIZE_BYTES) {
    return {
      code: "FILE_TOO_LARGE",
      error: "Ebook files must be 100 MB or smaller.",
    };
  }

  const extension = ebookExtension(file.type);

  if (!extension) {
    return {
      code: "INVALID_FILE_TYPE",
      error: "Unsupported ebook file type.",
    };
  }

  const serviceSupabase = createServiceRoleClient();
  const { data: listingFormat, error: formatError } = await serviceSupabase
    .from("listing_formats")
    .select("id, ebook_file_path, format_type, listing_id")
    .eq("id", validation.data.listingFormatId)
    .maybeSingle();

  if (formatError || !listingFormat || listingFormat.format_type !== "ebook") {
    return {
      code: "NOT_FOUND",
      error: "Ebook format not found.",
    };
  }

  const { data: listing, error: listingError } = await serviceSupabase
    .from("listings")
    .select("id, library_id")
    .eq("id", listingFormat.listing_id)
    .eq("library_id", validation.data.libraryId)
    .maybeSingle();

  if (listingError || !listing) {
    return {
      code: "NOT_FOUND",
      error: "Listing not found.",
    };
  }

  const path = `${validation.data.libraryId}/${listing.id}/${listingFormat.id}/ebook.${extension}`;
  const { error: uploadError } = await serviceSupabase.storage
    .from("ebook_files")
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

  const { error: updateError } = await serviceSupabase
    .from("listing_formats")
    .update({ ebook_file_path: path })
    .eq("id", listingFormat.id);

  if (updateError) {
    return {
      code: "UPLOAD_FAILED",
      error: updateError.message,
    };
  }

  if (listingFormat.ebook_file_path && listingFormat.ebook_file_path !== path) {
    await serviceSupabase.storage
      .from("ebook_files")
      .remove([listingFormat.ebook_file_path]);
  }

  await logAuditEvent({
    action: "catalog_ebook_uploaded",
    metadata: {
      libraryId: validation.data.libraryId,
      path,
    },
    targetId: listing.id,
    targetType: "listing",
    userId: auth.userId,
  });

  return {
    path,
    success: true,
  };
}
