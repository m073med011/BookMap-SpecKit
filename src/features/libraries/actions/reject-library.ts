"use server";

import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/features/auth/services/audit-service";
import { requireRole } from "@/features/roles/services/authorize";
import { moderationSchema } from "../schemas/library";
import { transitionLibraryStatus } from "../services/library-service";

export async function rejectLibraryAction(input: unknown) {
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

  try {
    await requireRole("admin");
  } catch {
    return {
      code: "UNAUTHORIZED",
      error: "You do not have permission to reject libraries.",
    };
  }

  const validation = moderationSchema.safeParse(input);

  if (!validation.success) {
    return {
      code: "INVALID_INPUT",
      error: validation.error.issues[0]?.message ?? "Invalid moderation request.",
    };
  }

  const result = await transitionLibraryStatus(
    validation.data.libraryId,
    "rejected",
    user.id,
    validation.data.reason,
  );

  if ("success" in result) {
    await logAuditEvent({
      action: "library_rejected",
      metadata: {
        reason: validation.data.reason,
      },
      targetId: validation.data.libraryId,
      targetType: "library",
      userId: user.id,
    });
  }

  return result;
}
