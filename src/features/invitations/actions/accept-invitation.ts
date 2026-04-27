"use server";

import { createClient } from "@/lib/supabase/server";
import { acceptInvitationSchema } from "@/features/invitations/schemas/invitation";
import { acceptInvitation } from "@/features/invitations/services/invitation-service";

export async function acceptInvitationAction(formData: FormData) {
  const validatedInput = acceptInvitationSchema.safeParse({
    token: formData.get("token"),
  });

  if (!validatedInput.success) {
    return {
      code: "INVALID_TOKEN",
      error: validatedInput.error.issues[0]?.message ?? "Invalid token.",
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

  return acceptInvitation({
    token: validatedInput.data.token,
    userId: user.id,
  });
}
