export type UserRole = "user" | "library_staff" | "admin" | "superadmin";
export type ProfileStatus = "active" | "suspended";
export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export interface Profile {
  id: string;
  displayName: string;
  bio: string | null;
  preferredLocale: "en" | "ar";
  avatarUrl: string | null;
  status: ProfileStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UserRoleAssignment {
  id: string;
  userId: string;
  role: UserRole;
  libraryId: string | null;
  assignedBy: string | null;
  assignedAt: string;
}

export interface StaffInvitation {
  id: string;
  email: string;
  libraryId: string;
  invitedBy: string | null;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
}
