export type LibraryStatus =
  | "draft"
  | "pending_approval"
  | "active"
  | "suspended"
  | "rejected"
  | "archived";

export type LibraryRole = "owner" | "staff";

export type Library = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  address: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  socialLinks: Record<string, string>;
  languages: string[];
  policies: Record<string, string>;
  status: LibraryStatus;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
};

export type LibraryStaffMembership = {
  id: string;
  libraryId: string;
  userId: string;
  libraryRole: LibraryRole;
  assignedBy: string | null;
  createdAt: string;
};

export type LibrarySettings = {
  id: string;
  libraryId: string;
  shippingPreferences: Record<string, unknown>;
  returnPolicy: string | null;
  operatingHours: Record<string, unknown>;
  customSettings: Record<string, unknown>;
  updatedAt: string;
};

export type LibraryStatusHistoryEntry = {
  id: string;
  libraryId: string;
  previousStatus: LibraryStatus | null;
  newStatus: LibraryStatus;
  reason: string | null;
  changedBy: string | null;
  createdAt: string;
};

export type ModerationAction =
  | "approve"
  | "reject"
  | "suspend"
  | "reactivate"
  | "archive";
