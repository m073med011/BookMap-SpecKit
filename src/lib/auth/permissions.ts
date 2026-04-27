export type Permission = string;

export const ROLES = {
  ADMIN: "admin",
  LIBRARY_STAFF: "library_staff",
  SUPERADMIN: "superadmin",
  USER: "user",
} as const;

type RoleAssignment = {
  libraryId: string | null;
  role: string;
};

export function hasRole(
  roles: RoleAssignment[],
  requiredRole: string,
  libraryId?: string,
): boolean {
  return roles.some((entry) => {
    if (entry.role !== requiredRole) {
      return false;
    }

    if (libraryId === undefined) {
      return true;
    }

    return entry.libraryId === libraryId;
  });
}
