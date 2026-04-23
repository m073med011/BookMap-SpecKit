"use server";

import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/features/auth/services/audit-service";
import { requireSuperadmin } from "@/features/roles/services/authorize";
import type { Database } from "@/types/supabase";

export async function removeRoleAction(formData: FormData) {
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let deleteQuery = supabase
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .eq(
      "role",
      role as Database["public"]["Tables"]["user_roles"]["Row"]["role"],
    );

  deleteQuery = libraryId
    ? deleteQuery.eq("library_id", libraryId)
    : deleteQuery.is("library_id", null);

  const { data, error } = await deleteQuery.select("id");

  if (error) {
    return {
      code: "NOT_FOUND",
      error: error.message,
    };
  }

  if (!data || data.length === 0) {
    return {
      code: "NOT_FOUND",
      error: "Role assignment not found.",
    };
  }

  await logAuditEvent({
    action: "role_removed",
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
