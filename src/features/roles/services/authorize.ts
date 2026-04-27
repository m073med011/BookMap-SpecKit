import "server-only";
import { redirect } from "next/navigation";
import { hasRole } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/features/auth/types";
import { getProfile } from "@/features/profiles/services/profile-service";

type RoleClaim = {
  libraryId: string | null;
  role: string;
};

function normalizeRoles(
  roles:
    | Array<{ libraryId?: string | null; library_id?: string | null; role: string }>
    | undefined,
): RoleClaim[] {
  return (
    roles?.map((entry) => ({
      libraryId: entry.libraryId ?? entry.library_id ?? null,
      role: entry.role,
    })) ?? []
  );
}

export async function requireRole(requiredRole: UserRole): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  const roles = normalizeRoles(
    user.app_metadata?.roles as
      | Array<{ libraryId?: string | null; library_id?: string | null; role: string }>
      | undefined,
  );

  const isAuthorized =
    hasRole(roles, requiredRole) ||
    (requiredRole === "admin" && hasRole(roles, "superadmin"));

  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED");
  }
}

export async function requireSuperadmin(): Promise<void> {
  await requireRole("superadmin");
}

export async function requireLibraryStaff(libraryId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  const roles = normalizeRoles(
    user.app_metadata?.roles as
      | Array<{ libraryId?: string | null; library_id?: string | null; role: string }>
      | undefined,
  );

  if (hasRole(roles, "admin") || hasRole(roles, "superadmin")) {
    return;
  }

  const { data: membership, error } = await supabase
    .from("library_staff_memberships")
    .select("id")
    .eq("library_id", libraryId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membership || hasRole(roles, "library_staff", libraryId)) {
    return;
  }

  if (error || !membership) {
    throw new Error("UNAUTHORIZED");
  }
}

export async function requireLibraryOwner(libraryId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  const roles = normalizeRoles(
    user.app_metadata?.roles as
      | Array<{ libraryId?: string | null; library_id?: string | null; role: string }>
      | undefined,
  );

  if (hasRole(roles, "admin") || hasRole(roles, "superadmin")) {
    return;
  }

  const { data: membership, error } = await supabase
    .from("library_staff_memberships")
    .select("library_role")
    .eq("library_id", libraryId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !membership || membership.library_role !== "owner") {
    throw new Error("UNAUTHORIZED");
  }
}

export async function getCurrentUserWithRoles(): Promise<{
  profile: Profile | null;
  roles: RoleClaim[];
  user: Awaited<ReturnType<typeof createClient>> extends infer T
    ? T extends { auth: { getUser: () => Promise<{ data: { user: infer U } }> } }
      ? U
      : never
    : never;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/en/auth/sign-in");
  }

  const roles = normalizeRoles(
    user.app_metadata?.roles as
      | Array<{ libraryId?: string | null; library_id?: string | null; role: string }>
      | undefined,
  );
  const profile = await getProfile(user.id);

  return {
    profile,
    roles,
    user,
  };
}
