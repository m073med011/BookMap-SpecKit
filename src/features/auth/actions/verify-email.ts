"use server";

import { verifyEmailSchema } from "@/features/auth/schemas/auth";
import { verifyEmail } from "@/features/auth/services/auth-service";

export type VerifyEmailActionResult =
  | { success: true }
  | { code: string; error: string };

export async function verifyEmailAction(
  formData: FormData,
): Promise<VerifyEmailActionResult> {
  const validatedInput = verifyEmailSchema.safeParse({
    token: formData.get("token"),
    type: formData.get("type"),
  });

  if (!validatedInput.success) {
    return {
      code: "INVALID_TOKEN",
      error: validatedInput.error.issues[0]?.message ?? "Invalid token.",
    };
  }

  return verifyEmail(validatedInput.data);
}
