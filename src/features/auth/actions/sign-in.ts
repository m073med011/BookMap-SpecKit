"use server";

import { createClient } from "@/lib/supabase/server";
import { signInSchema } from "@/features/auth/schemas/auth";
import { logAuditEvent } from "@/features/auth/services/audit-service";
import { getRoleRedirectPath } from "@/features/roles/services/role-service";

type SignInResult =
  | { success: true; redirectTo: string }
  | {
      code: SignInErrorCode;
      error: string;
    };

type SignInErrorCode =
  | "ACCOUNT_SUSPENDED"
  | "EMAIL_NOT_VERIFIED"
  | "INVALID_CREDENTIALS"
  | "RATE_LIMITED"
  | "VALIDATION_ERROR";

function mapSignInError(message: string): SignInErrorCode {
  const normalized = message.toLowerCase();

  if (normalized.includes("email not confirmed")) {
    return "EMAIL_NOT_VERIFIED";
  }

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid credentials")
  ) {
    return "INVALID_CREDENTIALS";
  }

  if (
    normalized.includes("rate limit") ||
    normalized.includes("too many requests")
  ) {
    return "RATE_LIMITED";
  }

  return "INVALID_CREDENTIALS";
}

export async function signInAction(formData: FormData): Promise<SignInResult> {
  const validatedInput = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedInput.success) {
    return {
      code: "VALIDATION_ERROR",
      error: validatedInput.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const locale = formData.get("locale");
  const normalizedLocale = locale === "ar" ? "ar" : "en";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(
    validatedInput.data,
  );

  if (error || !data.user) {
    return {
      code: mapSignInError(error?.message ?? "Invalid login credentials."),
      error: error?.message ?? "Unable to sign in.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profile?.status === "suspended") {
    await supabase.auth.signOut();

    return {
      code: "ACCOUNT_SUSPENDED",
      error: "This account has been suspended.",
    };
  }

  const roles =
    (data.user.app_metadata?.roles as
      | Array<{ libraryId?: string | null; library_id?: string | null; role: string }>
      | undefined
    )?.map((entry) => ({
      libraryId: entry.libraryId ?? entry.library_id ?? null,
      role: entry.role,
    })) ?? [];

  const redirectTo = getRoleRedirectPath(roles, normalizedLocale);

  await logAuditEvent({
    action: "sign_in",
    userId: data.user.id,
  });

  return {
    redirectTo,
    success: true,
  };
}
