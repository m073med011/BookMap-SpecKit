"use server";

import { env } from "@/lib/config/env";
import { createClient } from "@/lib/supabase/server";
import {
  resetPasswordRequestSchema,
  resetPasswordSchema,
} from "@/features/auth/schemas/auth";
import { logAuditEvent } from "@/features/auth/services/audit-service";

type RequestPasswordResetResult = { success: true };

type ResetPasswordResult =
  | { success: true }
  | {
      code: ResetPasswordErrorCode;
      error: string;
    };

type ResetPasswordErrorCode =
  | "EXPIRED_TOKEN"
  | "INVALID_TOKEN"
  | "VALIDATION_ERROR"
  | "WEAK_PASSWORD";

function mapResetPasswordError(message: string): ResetPasswordErrorCode {
  const normalized = message.toLowerCase();

  if (normalized.includes("expired")) {
    return "EXPIRED_TOKEN";
  }

  if (normalized.includes("password") && normalized.includes("weak")) {
    return "WEAK_PASSWORD";
  }

  return "INVALID_TOKEN";
}

export async function requestPasswordResetAction(
  formData: FormData,
): Promise<RequestPasswordResetResult> {
  const validatedInput = resetPasswordRequestSchema.safeParse({
    email: formData.get("email"),
  });
  const locale = formData.get("locale") === "ar" ? "ar" : "en";

  if (!validatedInput.success) {
    return { success: true };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(validatedInput.data.email, {
    redirectTo: `${env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/${locale}/auth/reset-password`,
  });

  return { success: true };
}

export async function resetPasswordAction(
  formData: FormData,
): Promise<ResetPasswordResult> {
  const validatedInput = resetPasswordSchema.safeParse({
    code: formData.get("code"),
    password: formData.get("password"),
  });

  if (!validatedInput.success) {
    return {
      code: "VALIDATION_ERROR",
      error: validatedInput.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const supabase = await createClient();
  const { code, password } = validatedInput.data;
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(
    code,
  );

  if (exchangeError) {
    return {
      code: mapResetPasswordError(exchangeError.message),
      error: exchangeError.message,
    };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password,
  });

  if (updateError) {
    return {
      code: mapResetPasswordError(updateError.message),
      error: updateError.message,
    };
  }

  if (data.user) {
    await logAuditEvent({
      action: "password_reset",
      userId: data.user.id,
    });
  }

  return { success: true };
}
