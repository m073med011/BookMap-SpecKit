"use server";

import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/features/auth/services/audit-service";
import { getProfile } from "@/features/profiles/services/profile-service";
import { requireRole } from "@/features/roles/services/authorize";
import { getLibrary, transitionLibraryStatus } from "../services/library-service";

export async function approveLibraryAction(input: { libraryId: string }) {
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
      error: "You do not have permission to approve libraries.",
    };
  }

  const library = await getLibrary(input.libraryId);

  if (!library) {
    return {
      code: "NOT_FOUND",
      error: "Library not found.",
    };
  }

  const ownerProfile = await getProfile(library.ownerId);

  if (ownerProfile?.status === "suspended") {
    return {
      code: "OWNER_SUSPENDED",
      error: "Cannot approve - library owner is suspended.",
    };
  }

  const result = await transitionLibraryStatus(
    input.libraryId,
    "active",
    user.id,
  );

  if ("success" in result) {
    await logAuditEvent({
      action: "library_approved",
      targetId: input.libraryId,
      targetType: "library",
      userId: user.id,
    });
  }

  return result;
}
