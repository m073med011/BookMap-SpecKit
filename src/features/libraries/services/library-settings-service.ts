import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/supabase";
import type { LibrarySettings } from "../types";

type SettingsResult = { success: true } | { code: string; error: string };

type SettingsRow = {
  custom_settings: Json;
  id: string;
  library_id: string;
  operating_hours: Json;
  return_policy: string | null;
  shipping_preferences: Json;
  updated_at: string;
};

function toUnknownRecord(value: Json | null | undefined): Record<string, unknown> {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return {};
  }

  return value as Record<string, unknown>;
}

function mapSettings(row: SettingsRow): LibrarySettings {
  return {
    id: row.id,
    libraryId: row.library_id,
    shippingPreferences: toUnknownRecord(row.shipping_preferences),
    returnPolicy: row.return_policy,
    operatingHours: toUnknownRecord(row.operating_hours),
    customSettings: toUnknownRecord(row.custom_settings),
    updatedAt: row.updated_at,
  };
}

export async function getLibrarySettings(
  libraryId: string,
): Promise<LibrarySettings | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("library_settings")
    .select(
      "id, library_id, shipping_preferences, return_policy, operating_hours, custom_settings, updated_at",
    )
    .eq("library_id", libraryId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapSettings(data);
}

export async function updateLibrarySettings(
  libraryId: string,
  input: {
    shippingPreferences?: Record<string, unknown>;
    returnPolicy?: string;
    operatingHours?: Record<string, unknown>;
  },
): Promise<SettingsResult> {
  const supabase = await createClient();
  const payload: Database["public"]["Tables"]["library_settings"]["Insert"] = {
    library_id: libraryId,
    operating_hours: (input.operatingHours ?? {}) as Json,
    return_policy: input.returnPolicy?.trim() || null,
    shipping_preferences: (input.shippingPreferences ?? {}) as Json,
  };
  const { error } = await supabase
    .from("library_settings")
    .upsert(payload, {
      onConflict: "library_id",
    });

  if (error) {
    return {
      code: "SETTINGS_UPDATE_FAILED",
      error: error.message,
    };
  }

  return { success: true };
}
