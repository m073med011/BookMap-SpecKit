"use server";

import { ROLES } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/features/auth/services/audit-service";
import { requireSuperadmin } from "@/features/roles/services/authorize";
import type { Database } from "@/types/supabase";

const validRoles = Object.values(ROLES);

export async function assignRoleAction(formData: FormData) {
  try {
    await requireSuperadmin();
  } catch {
    return {
      code: "UNAUTHORIZED",
      error: "Unauthorized",
    };
  }

  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");
  const libraryId = String(formData.get("libraryId") ?? "") || null;

  if (!validRoles.includes(role as (typeof validRoles)[number])) {
    return {
      code: "INVALID_ROLE",
      error: "Invalid role.",
    };
  }

  if (role === "library_staff" && !libraryId) {
    return {
      code: "INVALID_ROLE",
      error: "Library staff roles require a library.",
    };
  }

  const supabase = await createClient();
  let existingAssignmentQuery = supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq(
      "role",
      role as Database["public"]["Tables"]["user_roles"]["Row"]["role"],
    );

  existingAssignmentQuery = libraryId
    ? existingAssignmentQuery.eq("library_id", libraryId)
    : existingAssignmentQuery.is("library_id", null);

  const { data: existingAssignment } = await existingAssignmentQuery.maybeSingle();

  if (existingAssignment) {
    return {
      code: "ALREADY_ASSIGNED",
      error: "Role already assigned.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("user_roles").insert({
    assigned_by: user?.id ?? null,
    library_id: role === "library_staff" ? libraryId : null,
    role: role as "admin" | "library_staff" | "superadmin" | "user",
    user_id: userId,
  });

  if (error) {
    return {
      code: "INVALID_ROLE",
      error: error.message,
    };
  }

  await logAuditEvent({
    action: "role_assigned",
    metadata: {
      libraryId,
      role,
    },
    targetId: userId,
    targetType: "user_role",
    userId: user?.id,
  });

  return { success: true };
}
