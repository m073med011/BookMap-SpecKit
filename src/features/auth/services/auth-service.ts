import "server-only";
import { env } from "@/lib/config/env";
import { createClient } from "@/lib/supabase/server";
import {
  signInSchema,
  signUpSchema,
  verifyEmailSchema,
} from "@/features/auth/schemas/auth";
import { logAuditEvent } from "@/features/auth/services/audit-service";

type AuthErrorCode =
  | "EMAIL_TAKEN"
  | "EXPIRED_TOKEN"
  | "INVALID_TOKEN"
  | "RATE_LIMITED"
  | "UNKNOWN"
  | "WEAK_PASSWORD";

type AuthResult = { success: true } | { code: AuthErrorCode; error: string };

function mapAuthError(message: string): AuthErrorCode {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("already registered") ||
    normalized.includes("already been registered") ||
    normalized.includes("user already registered")
  ) {
    return "EMAIL_TAKEN";
  }

  if (
    normalized.includes("password") &&
    (normalized.includes("weak") || normalized.includes("secure"))
  ) {
    return "WEAK_PASSWORD";
  }

  if (
    normalized.includes("rate limit") ||
    normalized.includes("too many requests")
  ) {
    return "RATE_LIMITED";
  }

  if (normalized.includes("expired")) {
    return "EXPIRED_TOKEN";
  }

  if (
    normalized.includes("invalid") ||
    normalized.includes("token") ||
    normalized.includes("otp")
  ) {
    return "INVALID_TOKEN";
  }

  return "UNKNOWN";
}

function getSiteUrl() {
  return env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
}

export async function signUpWithEmail(input: {
  email: string;
  locale: "en" | "ar";
  password: string;
}): Promise<AuthResult> {
  const validatedInput = signUpSchema.safeParse(input);

  if (!validatedInput.success) {
    return {
      code: "UNKNOWN",
      error: validatedInput.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const supabase = await createClient();
  const { email, locale, password } = validatedInput.data;
  const { error } = await supabase.auth.signUp({
    email,
    options: {
      data: {
        locale,
      },
      emailRedirectTo: `${getSiteUrl()}/${locale}/auth/callback`,
    },
    password,
  });

  if (error) {
    return {
      code: mapAuthError(error.message),
      error: error.message,
    };
  }

  return { success: true };
}

export async function signInWithGoogle(input: {
  redirectTo: string;
}): Promise<{ url: string } | { code: "UNKNOWN"; error: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    options: {
      redirectTo: input.redirectTo,
    },
    provider: "google",
  });

  if (error || !data.url) {
    return {
      code: "UNKNOWN",
      error: error?.message ?? "Unable to start Google sign-in.",
    };
  }

  return { url: data.url };
}

export async function verifyEmail(input: {
  token: string;
  type: "otp" | "link";
}): Promise<AuthResult> {
  const validatedInput = verifyEmailSchema.safeParse(input);

  if (!validatedInput.success) {
    return {
      code: "INVALID_TOKEN",
      error: validatedInput.error.issues[0]?.message ?? "Invalid token.",
    };
  }

  const supabase = await createClient();
  const { token } = validatedInput.data;
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: "email",
  });

  if (error) {
    return {
      code: mapAuthError(error.message),
      error: error.message,
    };
  }

  if (data.user) {
    await logAuditEvent({
      action: "email_verified",
      targetId: data.user.id,
      targetType: "profile",
      userId: data.user.id,
    });
  }

  return { success: true };
}

export async function signOut(): Promise<{ success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await logAuditEvent({
      action: "sign_out",
      userId: user.id,
    });
  }

  await supabase.auth.signOut();

  return { success: true };
}
