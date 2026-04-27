import "server-only";
import { createClient } from "@/lib/supabase/server";

export type RoleScope = {
  libraryId: string | null;
  role: string;
};

export async function getUserRoles(userId: string): Promise<RoleScope[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_roles")
    .select("role, library_id")
    .eq("user_id", userId);

  if (error || !data) {
    return [];
  }

  return data.map((entry) => ({
    libraryId: entry.library_id,
    role: entry.role,
  }));
}

export function getRoleRedirectPath(
  roles: RoleScope[],
  locale: string,
): string {
  if (roles.some((entry) => entry.role === "superadmin" || entry.role === "admin")) {
    return `/${locale}/dashboard/admin`;
  }

  const staffRole = roles.find(
    (entry) => entry.role === "library_staff" && entry.libraryId,
  );

  if (staffRole?.libraryId) {
    return `/${locale}/dashboard/library/${staffRole.libraryId}`;
  }

  return `/${locale}/dashboard`;
}
