import "server-only";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/features/auth/services/audit-service";
import type { Database, Json } from "@/types/supabase";
import type {
  Library,
  LibraryRole,
  LibraryStatus,
  LibraryStatusHistoryEntry,
} from "../types";
import { REQUIRES_REASON, validateTransition } from "./library-status-machine";
import { generateLibrarySlug } from "../utils/slug";

type ServiceResult<TSuccess> = TSuccess | { code: string; error: string };

type CreateLibraryInput = {
  name: string;
  slug?: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  languages?: string[];
  ownerId: string;
};

type UpdateLibraryInput = Partial<{
  name: string;
  slug: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  socialLinks: Record<string, string>;
  languages: string[];
  policies: Record<string, string>;
}>;

export type LibraryWithRole = Library & {
  role: LibraryRole;
};

type LibraryRow = Database["public"]["Tables"]["libraries"]["Row"];
type LibraryInsert = Database["public"]["Tables"]["libraries"]["Insert"];
type LibraryUpdate = Database["public"]["Tables"]["libraries"]["Update"];
type LibraryStatusHistoryRow =
  Database["public"]["Tables"]["library_status_history"]["Row"];

function normalizeTextValue(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toStringRecord(value: Json | null | undefined): Record<string, string> {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return {};
  }

  return Object.entries(value).reduce<Record<string, string>>(
    (result, [key, entryValue]) => {
      if (typeof entryValue === "string") {
        result[key] = entryValue;
      }

      return result;
    },
    {},
  );
}

function mapLibrary(row: LibraryRow): Library {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    logoUrl: row.logo_url,
    bannerUrl: row.banner_url,
    address: row.address,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    socialLinks: toStringRecord(row.social_links),
    languages: row.languages,
    policies: toStringRecord(row.policies),
    status: row.status,
    ownerId: row.owner_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapStatusHistoryEntry(
  row: LibraryStatusHistoryRow,
): LibraryStatusHistoryEntry {
  return {
    id: row.id,
    libraryId: row.library_id,
    previousStatus: row.previous_status,
    newStatus: row.new_status,
    reason: row.reason,
    changedBy: row.changed_by,
    createdAt: row.created_at,
  };
}

async function cleanupCreatedLibrary(libraryId: string) {
  const serviceSupabase = createServiceRoleClient();
  await serviceSupabase.from("library_settings").delete().eq("library_id", libraryId);
  await serviceSupabase
    .from("library_staff_memberships")
    .delete()
    .eq("library_id", libraryId);
  await serviceSupabase
    .from("user_roles")
    .delete()
    .eq("library_id", libraryId)
    .eq("role", "library_staff");
  await serviceSupabase.from("libraries").delete().eq("id", libraryId);
}

export async function createLibrary(
  input: CreateLibraryInput,
): Promise<ServiceResult<{ success: true; libraryId: string }>> {
  const supabase = await createClient();
  const serviceSupabase = createServiceRoleClient();
  const slug = input.slug?.trim() || generateLibrarySlug(input.name);

  if (!slug) {
    return {
      code: "INVALID_SLUG",
      error: "Unable to generate a valid library URL.",
    };
  }

  const payload: LibraryInsert = {
    name: input.name.trim(),
    slug,
    description: normalizeTextValue(input.description),
    address: normalizeTextValue(input.address),
    banner_url: null,
    contact_email: normalizeTextValue(input.contactEmail),
    contact_phone: normalizeTextValue(input.contactPhone),
    languages:
      input.languages && input.languages.length > 0 ? input.languages : ["en"],
    logo_url: null,
    owner_id: input.ownerId,
    policies: {},
    social_links: {},
    status: "draft",
  };

  const { data: createdLibrary, error: createError } = await supabase
    .from("libraries")
    .insert(payload)
    .select("id")
    .single();

  if (createError || !createdLibrary) {
    return {
      code: createError?.code === "23505" ? "SLUG_TAKEN" : "CREATE_FAILED",
      error:
        createError?.code === "23505"
          ? "This library URL is already taken."
          : createError?.message ?? "Unable to create the library.",
    };
  }

  const libraryId = createdLibrary.id;

  const { error: membershipError } = await serviceSupabase
    .from("library_staff_memberships")
    .insert({
      assigned_by: null,
      library_id: libraryId,
      library_role: "owner",
      user_id: input.ownerId,
    });

  if (membershipError) {
    await cleanupCreatedLibrary(libraryId);
    return {
      code: "CREATE_FAILED",
      error: membershipError.message,
    };
  }

  const { data: existingUserRole } = await serviceSupabase
    .from("user_roles")
    .select("id")
    .eq("user_id", input.ownerId)
    .eq("role", "library_staff")
    .eq("library_id", libraryId)
    .maybeSingle();

  if (!existingUserRole) {
    const { error: userRoleError } = await serviceSupabase
      .from("user_roles")
      .insert({
        assigned_by: input.ownerId,
        library_id: libraryId,
        role: "library_staff",
        user_id: input.ownerId,
      });

    if (userRoleError) {
      await cleanupCreatedLibrary(libraryId);
      return {
        code: "CREATE_FAILED",
        error: userRoleError.message,
      };
    }
  }

  const { error: settingsError } = await serviceSupabase
    .from("library_settings")
    .insert({
      library_id: libraryId,
    });

  if (settingsError) {
    await cleanupCreatedLibrary(libraryId);
    return {
      code: "CREATE_FAILED",
      error: settingsError.message,
    };
  }

  const { error: historyError } = await serviceSupabase.rpc(
    "record_library_status_change",
    {
      p_changed_by: input.ownerId,
      p_library_id: libraryId,
      p_new_status: "draft",
      p_previous_status: null,
      p_reason: null,
    },
  );

  if (historyError) {
    await cleanupCreatedLibrary(libraryId);
    return {
      code: "CREATE_FAILED",
      error: historyError.message,
    };
  }

  await logAuditEvent({
    action: "library_created",
    metadata: {
      slug,
    },
    targetId: libraryId,
    targetType: "library",
    userId: input.ownerId,
  });

  return {
    libraryId,
    success: true,
  };
}

export async function getLibrary(libraryId: string): Promise<Library | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("libraries")
    .select(
      "id, name, slug, description, logo_url, banner_url, address, contact_email, contact_phone, social_links, languages, policies, status, owner_id, created_at, updated_at",
    )
    .eq("id", libraryId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapLibrary(data);
}

export async function getLibraryBySlug(slug: string): Promise<Library | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("libraries")
    .select(
      "id, name, slug, description, logo_url, banner_url, address, contact_email, contact_phone, social_links, languages, policies, status, owner_id, created_at, updated_at",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapLibrary(data);
}

export async function updateLibrary(
  libraryId: string,
  input: UpdateLibraryInput,
): Promise<ServiceResult<{ success: true }>> {
  const supabase = await createClient();
  const payload: LibraryUpdate = {};

  if (input.slug !== undefined) {
    const slug = input.slug.trim();

    const { data: existingLibrary } = await supabase
      .from("libraries")
      .select("id")
      .eq("slug", slug)
      .neq("id", libraryId)
      .maybeSingle();

    if (existingLibrary) {
      return {
        code: "SLUG_TAKEN",
        error: "This library URL is already taken.",
      };
    }

    payload.slug = slug;
  }

  if (input.name !== undefined) {
    payload.name = input.name.trim();
  }

  if (input.description !== undefined) {
    payload.description = normalizeTextValue(input.description);
  }

  if (input.contactEmail !== undefined) {
    payload.contact_email = normalizeTextValue(input.contactEmail);
  }

  if (input.contactPhone !== undefined) {
    payload.contact_phone = normalizeTextValue(input.contactPhone);
  }

  if (input.address !== undefined) {
    payload.address = normalizeTextValue(input.address);
  }

  if (input.socialLinks !== undefined) {
    payload.social_links = input.socialLinks as Json;
  }

  if (input.languages !== undefined) {
    payload.languages = input.languages;
  }

  if (input.policies !== undefined) {
    payload.policies = input.policies as Json;
  }

  const { error } = await supabase
    .from("libraries")
    .update(payload)
    .eq("id", libraryId);

  if (error) {
    return {
      code: error.code === "23505" ? "SLUG_TAKEN" : "UPDATE_FAILED",
      error:
        error.code === "23505"
          ? "This library URL is already taken."
          : error.message,
    };
  }

  await logAuditEvent({
    action: "library_updated",
    targetId: libraryId,
    targetType: "library",
  });

  return { success: true };
}

export async function getLibrariesByOwner(ownerId: string): Promise<Library[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("libraries")
    .select(
      "id, name, slug, description, logo_url, banner_url, address, contact_email, contact_phone, social_links, languages, policies, status, owner_id, created_at, updated_at",
    )
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(mapLibrary);
}

export async function getLibrariesByStatus(
  status: LibraryStatus,
): Promise<Library[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("libraries")
    .select(
      "id, name, slug, description, logo_url, banner_url, address, contact_email, contact_phone, social_links, languages, policies, status, owner_id, created_at, updated_at",
    )
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(mapLibrary);
}

export async function getLibrariesForUser(
  userId: string,
): Promise<LibraryWithRole[]> {
  const supabase = await createClient();
  const { data: memberships, error: membershipsError } = await supabase
    .from("library_staff_memberships")
    .select("library_id, library_role")
    .eq("user_id", userId);

  if (membershipsError || !memberships || memberships.length === 0) {
    return [];
  }

  const libraryIds = memberships.map((membership) => membership.library_id);
  const { data: libraries, error: librariesError } = await supabase
    .from("libraries")
    .select(
      "id, name, slug, description, logo_url, banner_url, address, contact_email, contact_phone, social_links, languages, policies, status, owner_id, created_at, updated_at",
    )
    .in("id", libraryIds);

  if (librariesError || !libraries) {
    return [];
  }

  const roleByLibraryId = new Map(
    memberships.map((membership) => [
      membership.library_id,
      membership.library_role,
    ]),
  );

  return libraries
    .map((library) => ({
      ...mapLibrary(library),
      role: roleByLibraryId.get(library.id) ?? "staff",
    }))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function transitionLibraryStatus(
  libraryId: string,
  newStatus: LibraryStatus,
  changedBy: string,
  reason?: string,
): Promise<ServiceResult<{ success: true }>> {
  const supabase = await createClient();
  const serviceSupabase = createServiceRoleClient();
  const currentLibrary = await getLibrary(libraryId);

  if (!currentLibrary) {
    return {
      code: "NOT_FOUND",
      error: "Library not found.",
    };
  }

  try {
    validateTransition(currentLibrary.status, newStatus);
  } catch (error) {
    return {
      code: "INVALID_TRANSITION",
      error:
        error instanceof Error
          ? error.message
          : "Invalid library status transition.",
    };
  }

  if (REQUIRES_REASON.includes(newStatus) && !reason?.trim()) {
    return {
      code: "REASON_REQUIRED",
      error: "A reason is required for this status change.",
    };
  }

  const { error: updateError } = await supabase
    .from("libraries")
    .update({
      status: newStatus,
    })
    .eq("id", libraryId);

  if (updateError) {
    return {
      code: "STATUS_UPDATE_FAILED",
      error: updateError.message,
    };
  }

  const { error: historyError } = await serviceSupabase.rpc(
    "record_library_status_change",
    {
      p_changed_by: changedBy,
      p_library_id: libraryId,
      p_new_status: newStatus,
      p_previous_status: currentLibrary.status,
      p_reason: reason?.trim() ?? null,
    },
  );

  if (historyError) {
    return {
      code: "STATUS_UPDATE_FAILED",
      error: historyError.message,
    };
  }

  await logAuditEvent({
    action: "library_status_changed",
    metadata: {
      from: currentLibrary.status,
      reason: reason?.trim() ?? null,
      to: newStatus,
    },
    targetId: libraryId,
    targetType: "library",
    userId: changedBy,
  });

  return { success: true };
}

export async function getStatusHistory(
  libraryId: string,
): Promise<LibraryStatusHistoryEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("library_status_history")
    .select(
      "id, library_id, previous_status, new_status, reason, changed_by, created_at",
    )
    .eq("library_id", libraryId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(mapStatusHistoryEntry);
}
