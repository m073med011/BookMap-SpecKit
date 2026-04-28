"use server";

import { logAuditEvent } from "@/features/auth/services/audit-service";
import { requireLibraryStaff } from "@/features/roles/services/authorize";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { updateInventorySchema } from "../schemas";

type ActionError = {
  code: string;
  error: string;
};

type InventorySuccess = {
  stock_quantity: number;
  success: true;
};

export async function updateInventoryAction(
  input: unknown,
): Promise<InventorySuccess | ActionError> {
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

  const validation = updateInventorySchema.safeParse(input);

  if (!validation.success) {
    return {
      code: "INVALID_INPUT",
      error: validation.error.issues[0]?.message ?? "Invalid inventory update.",
    };
  }

  const serviceSupabase = createServiceRoleClient();
  const { data: listingFormat, error: formatError } = await serviceSupabase
    .from("listing_formats")
    .select("id, format_type, listing_id")
    .eq("id", validation.data.listing_format_id)
    .maybeSingle();

  if (formatError || !listingFormat || listingFormat.format_type !== "physical") {
    return {
      code: "NOT_FOUND",
      error: "Physical listing format not found.",
    };
  }

  const { data: listing, error: listingError } = await serviceSupabase
    .from("listings")
    .select("id, library_id")
    .eq("id", listingFormat.listing_id)
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
      error: "You do not have permission to update this inventory.",
    };
  }

  const { data: inventory, error: inventoryError } = await serviceSupabase
    .from("inventory")
    .select("id, stock_quantity")
    .eq("listing_format_id", listingFormat.id)
    .maybeSingle();

  if (inventoryError || !inventory) {
    return {
      code: "NOT_FOUND",
      error: "Inventory record not found.",
    };
  }

  const nextQuantity = inventory.stock_quantity + validation.data.adjustment;

  if (nextQuantity < 0) {
    return {
      code: "NEGATIVE_STOCK",
      error: "Stock cannot be reduced below zero.",
    };
  }

  const { error: updateError } = await serviceSupabase
    .from("inventory")
    .update({ stock_quantity: nextQuantity })
    .eq("id", inventory.id);

  if (updateError) {
    return {
      code: "UPDATE_FAILED",
      error: updateError.message,
    };
  }

  await logAuditEvent({
    action: "catalog_inventory_updated",
    metadata: {
      adjustment: validation.data.adjustment,
      listingFormatId: listingFormat.id,
      stockQuantity: nextQuantity,
    },
    targetId: listing.id,
    targetType: "listing",
    userId: user.id,
  });

  return {
    stock_quantity: nextQuantity,
    success: true,
  };
}
