"use server";

import { signUpSchema } from "@/features/auth/schemas/auth";
import { signUpWithEmail } from "@/features/auth/services/auth-service";

export type SignUpActionResult =
  | { success: true }
  | { code: string; error: string };

export async function signUpAction(
  formData: FormData,
): Promise<SignUpActionResult> {
  const validatedInput = signUpSchema.safeParse({
    email: formData.get("email"),
    locale: formData.get("locale"),
    password: formData.get("password"),
  });

  if (!validatedInput.success) {
    return {
      code: "VALIDATION_ERROR",
      error: validatedInput.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  return signUpWithEmail(validatedInput.data);
}
