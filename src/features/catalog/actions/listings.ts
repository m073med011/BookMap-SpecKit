"use server";

import { logAuditEvent } from "@/features/auth/services/audit-service";
import { requireLibraryStaff } from "@/features/roles/services/authorize";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import type { Json, Database } from "@/types/supabase";
import {
  createListingSchema,
  type ListingFormatType,
  type ListingStatus,
  updateListingStatusSchema,
} from "../schemas";

type ActionError = {
  code: string;
  error: string;
};

type CreateListingSuccess = {
  listing_id: string;
  success: true;
};

type UpdateListingStatusSuccess = {
  status: ListingStatus;
  success: true;
};

type ListingInsert = Database["public"]["Tables"]["listings"]["Insert"];
type ListingFormatInsert =
  Database["public"]["Tables"]["listing_formats"]["Insert"];

const NEXT_STATUS: Partial<Record<ListingStatus, ListingStatus>> = {
  draft: "pending_review",
  pending_review: "published",
  published: "unpublished",
  unpublished: "archived",
};

function jsonRecord(value: Json): Record<string, unknown> {
  return !Array.isArray(value) && value !== null && typeof value === "object"
    ? value
    : {};
}

function getManualReviewFlag(value: Json): boolean {
  const settings = jsonRecord(value);
  return (
    settings.catalog_manual_review_required === true ||
    settings.catalogManualReviewRequired === true
  );
}

async function getApprovalRequired(libraryId: string): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("library_settings")
    .select("custom_settings")
    .eq("library_id", libraryId)
    .maybeSingle();

  return data ? getManualReviewFlag(data.custom_settings) : false;
}

async function verifyBookOwnership(
  bookId: string,
  libraryId: string,
): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("books")
    .select("id")
    .eq("id", bookId)
    .eq("library_id", libraryId)
    .maybeSingle();

  return Boolean(data);
}

async function listingHasPublishableMedia(listingId: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  const supabase = createServiceRoleClient();
  const { data: listing } = await supabase
    .from("listings")
    .select("book_id")
    .eq("id", listingId)
    .maybeSingle();

  if (!listing) {
    return {
      error: "Listing not found.",
      ok: false,
    };
  }

  const { data: book } = await supabase
    .from("books")
    .select("cover_image_path")
    .eq("id", listing.book_id)
    .maybeSingle();

  if (!book?.cover_image_path) {
    return {
      error: "Upload a cover image before publishing.",
      ok: false,
    };
  }

  const { data: ebookFormats } = await supabase
    .from("listing_formats")
    .select("id, ebook_file_path")
    .eq("listing_id", listingId)
    .eq("format_type", "ebook");

  if (ebookFormats?.some((format) => !format.ebook_file_path)) {
    return {
      error: "Upload an ebook file before publishing ebook listings.",
      ok: false,
    };
  }

  return { ok: true };
}

export async function createListingAction(
  input: unknown,
): Promise<CreateListingSuccess | ActionError> {
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

  const validation = createListingSchema.safeParse(input);

  if (!validation.success) {
    return {
      code: "INVALID_INPUT",
      error: validation.error.issues[0]?.message ?? "Invalid listing data.",
    };
  }

  try {
    await requireLibraryStaff(validation.data.library_id);
  } catch {
    return {
      code: "UNAUTHORIZED",
      error: "You do not have permission to create listings for this library.",
    };
  }

  if (
    !(await verifyBookOwnership(
      validation.data.book_id,
      validation.data.library_id,
    ))
  ) {
    return {
      code: "INVALID_BOOK",
      error: "This book does not belong to the selected library.",
    };
  }

  const serviceSupabase = createServiceRoleClient();
  const approvalRequired = await getApprovalRequired(validation.data.library_id);
  const listingPayload: ListingInsert = {
    approval_required: approvalRequired,
    book_id: validation.data.book_id,
    library_id: validation.data.library_id,
    status: "draft",
  };

  const { data: listing, error: listingError } = await serviceSupabase
    .from("listings")
    .insert(listingPayload)
    .select("id")
    .single();

  if (listingError || !listing) {
    return {
      code: "CREATE_FAILED",
      error: listingError?.message ?? "Unable to create the listing.",
    };
  }

  for (const format of validation.data.formats) {
    const formatPayload: ListingFormatInsert = {
      ebook_file_path:
        format.type === "ebook" ? format.ebook_file_path ?? null : null,
      format_type: format.type,
      listing_id: listing.id,
      price: format.price,
    };

    const { data: listingFormat, error: formatError } = await serviceSupabase
      .from("listing_formats")
      .insert(formatPayload)
      .select("id")
      .single();

    if (formatError || !listingFormat) {
      await serviceSupabase.from("listings").delete().eq("id", listing.id);
      return {
        code: "CREATE_FAILED",
        error: formatError?.message ?? "Unable to create listing format.",
      };
    }

    if (format.type === "physical") {
      const { error: inventoryError } = await serviceSupabase
        .from("inventory")
        .insert({
          listing_format_id: listingFormat.id,
          stock_quantity: format.stock_quantity ?? 0,
        });

      if (inventoryError) {
        await serviceSupabase.from("listings").delete().eq("id", listing.id);
        return {
          code: "CREATE_FAILED",
          error: inventoryError.message,
        };
      }
    }
  }

  await logAuditEvent({
    action: "catalog_listing_created",
    metadata: {
      bookId: validation.data.book_id,
      formats: validation.data.formats.map(
        (format): ListingFormatType => format.type,
      ),
      libraryId: validation.data.library_id,
    },
    targetId: listing.id,
    targetType: "listing",
    userId: user.id,
  });

  return {
    listing_id: listing.id,
    success: true,
  };
}

export async function updateListingStatusAction(
  input: unknown,
): Promise<UpdateListingStatusSuccess | ActionError> {
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

  const validation = updateListingStatusSchema.safeParse(input);

  if (!validation.success) {
    return {
      code: "INVALID_INPUT",
      error: validation.error.issues[0]?.message ?? "Invalid status update.",
    };
  }

  const serviceSupabase = createServiceRoleClient();
  const { data: listing, error: listingError } = await serviceSupabase
    .from("listings")
    .select("id, approval_required, library_id, status")
    .eq("id", validation.data.listing_id)
    .maybeSingle();

  if (listingError || !listing) {
    return {
      code: "NOT_FOUND",
      error: "Listing not found.",
    };
  }

  try {
    await requireLibraryStaff(listing.library_id);
  } catch {
    return {
      code: "UNAUTHORIZED",
      error: "You do not have permission to update this listing.",
    };
  }

  if (listing.status === validation.data.new_status) {
    return {
      status: listing.status,
      success: true,
    };
  }

  const expectedStatus = NEXT_STATUS[listing.status];

  if (expectedStatus !== validation.data.new_status) {
    return {
      code: "INVALID_TRANSITION",
      error: `Listings must move from ${listing.status} to ${expectedStatus ?? "no further status"}.`,
    };
  }

  if (validation.data.new_status === "published") {
    const mediaCheck = await listingHasPublishableMedia(listing.id);

    if (!mediaCheck.ok) {
      return {
        code: "MISSING_MEDIA",
        error: mediaCheck.error ?? "Listing media is incomplete.",
      };
    }
  }

  const { error: updateError } = await serviceSupabase
    .from("listings")
    .update({ status: validation.data.new_status })
    .eq("id", listing.id);

  if (updateError) {
    return {
      code: "STATUS_UPDATE_FAILED",
      error: updateError.message,
    };
  }

  let finalStatus = validation.data.new_status;

  if (
    validation.data.new_status === "pending_review" &&
    !listing.approval_required
  ) {
    const mediaCheck = await listingHasPublishableMedia(listing.id);

    if (mediaCheck.ok) {
      const { error: autoPublishError } = await serviceSupabase
        .from("listings")
        .update({ status: "published" })
        .eq("id", listing.id);

      if (autoPublishError) {
        return {
          code: "STATUS_UPDATE_FAILED",
          error: autoPublishError.message,
        };
      }

      finalStatus = "published";
    }
  }

  await logAuditEvent({
    action: "catalog_listing_status_changed",
    metadata: {
      from: listing.status,
      to: finalStatus,
    },
    targetId: listing.id,
    targetType: "listing",
    userId: user.id,
  });

  return {
    status: finalStatus,
    success: true,
  };
}
