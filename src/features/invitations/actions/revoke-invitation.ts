"use server";

import { createClient } from "@/lib/supabase/server";
import { revokeInvitationSchema } from "@/features/invitations/schemas/invitation";
import { revokeInvitation } from "@/features/invitations/services/invitation-service";

export async function revokeInvitationAction(formData: FormData) {
  const validatedInput = revokeInvitationSchema.safeParse({
    invitationId: formData.get("invitationId"),
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

  return revokeInvitation({
    invitationId: validatedInput.data.invitationId,
    revokedBy: user.id,
  });
}
