import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function getUserProviders(userId: string): Promise<string[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.auth.admin.getUserById(userId);

  if (error || !data.user) {
    return [];
  }

  return (
    data.user.identities
      ?.map((identity) => identity.provider)
      .filter((provider): provider is string => typeof provider === "string") ??
    []
  );
}

export function hasEmailProvider(providers: string[]): boolean {
  return providers.includes("email");
}

export function hasOnlyGoogleProvider(providers: string[]): boolean {
  return providers.length === 1 && providers[0] === "google";
}
