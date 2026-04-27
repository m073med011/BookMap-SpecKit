"use server";

import { hasRole } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { sendInvitationSchema } from "@/features/invitations/schemas/invitation";
import { sendStaffInvitation } from "@/features/invitations/services/invitation-service";

export async function sendInvitationAction(formData: FormData) {
  const validatedInput = sendInvitationSchema.safeParse({
    email: formData.get("email"),
    libraryId: formData.get("libraryId"),
  });

  if (!validatedInput.success) {
    return {
      code: "INVALID_INPUT",
      error: validatedInput.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      code: "UNAUTHORIZED",
      error: "Unauthorized",
    };
  }

  const roles =
    (user.app_metadata?.roles as
      | Array<{ libraryId?: string | null; library_id?: string | null; role: string }>
      | undefined
    )?.map((entry) => ({
      libraryId: entry.libraryId ?? entry.library_id ?? null,
      role: entry.role,
    })) ?? [];
  const canInvite =
    hasRole(roles, "admin") ||
    hasRole(roles, "superadmin") ||
    hasRole(roles, "library_staff", validatedInput.data.libraryId);

  if (!canInvite) {
    return {
      code: "UNAUTHORIZED",
      error: "Unauthorized",
    };
  }

  return sendStaffInvitation({
    email: validatedInput.data.email,
    invitedBy: user.id,
    libraryId: validatedInput.data.libraryId,
  });
}
