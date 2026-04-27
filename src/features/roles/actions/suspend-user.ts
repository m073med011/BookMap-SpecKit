"use server";

import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/features/auth/services/audit-service";
import { requireSuperadmin } from "@/features/roles/services/authorize";

export async function suspendUserAction(formData: FormData) {
  try {
    await requireSuperadmin();
  } catch {
    return {
      code: "UNAUTHORIZED",
      error: "Unauthorized",
    };
  }

  const userId = String(formData.get("userId") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.status === "suspended") {
    return {
      code: "ALREADY_SUSPENDED",
      error: "User is already suspended.",
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      status: "suspended",
    })
    .eq("id", userId);

  if (error) {
    return {
      code: "UNAUTHORIZED",
      error: error.message,
    };
  }

  await logAuditEvent({
    action: "user_suspended",
    metadata: {
      reason,
    },
    targetId: userId,
    targetType: "profile",
    userId: user?.id,
  });

  return { success: true };
}

export async function unsuspendUserAction(formData: FormData) {
  try {
    await requireSuperadmin();
  } catch {
    return {
      code: "UNAUTHORIZED",
      error: "Unauthorized",
    };
  }

  const userId = String(formData.get("userId") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("profiles")
    .update({
      status: "active",
    })
    .eq("id", userId);

  if (error) {
    return {
      code: "UNAUTHORIZED",
      error: error.message,
    };
  }

  await logAuditEvent({
    action: "user_unsuspended",
    targetId: userId,
    targetType: "profile",
    userId: user?.id,
  });

  return { success: true };
}
