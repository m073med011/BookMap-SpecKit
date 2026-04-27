export type {
  UserRole,
  UserRoleAssignment,
} from "@/features/auth/types";

export type RoleCheckResult = {
  authorized: boolean;
  redirectTo?: string;
};
