import "server-only";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/features/auth/services/audit-service";
import type { LibraryRole, LibraryStaffMembership } from "../types";

type StaffServiceResult = { success: true } | { code: string; error: string };

type MembershipRow = {
  assigned_by: string | null;
  created_at: string;
  id: string;
  library_id: string;
  library_role: LibraryRole;
  user_id: string;
};

function mapMembership(row: MembershipRow): LibraryStaffMembership {
  return {
    id: row.id,
    libraryId: row.library_id,
    userId: row.user_id,
    libraryRole: row.library_role,
    assignedBy: row.assigned_by,
    createdAt: row.created_at,
  };
}

async function countOwners(libraryId: string) {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("library_staff_memberships")
    .select("id")
    .eq("library_id", libraryId)
    .eq("library_role", "owner");

  if (error || !data) {
    return 0;
  }

  return data.length;
}

export async function getStaffMembers(
  libraryId: string,
): Promise<(LibraryStaffMembership & { displayName: string; email: string })[]> {
  const supabase = await createClient();
  const serviceSupabase = createServiceRoleClient();
  const { data: memberships, error: membershipsError } = await supabase
    .from("library_staff_memberships")
    .select("id, library_id, user_id, library_role, assigned_by, created_at")
    .eq("library_id", libraryId)
    .order("created_at", { ascending: true });

  if (membershipsError || !memberships || memberships.length === 0) {
    return [];
  }

  const userIds = memberships.map((membership) => membership.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", userIds);

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile.display_name]),
  );

  const usersResponse = await serviceSupabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const emailMap = new Map(
    (usersResponse.data?.users ?? []).map((user) => [user.id, user.email ?? ""]),
  );

  return memberships.map((membership) => ({
    ...mapMembership(membership),
    displayName:
      profileMap.get(membership.user_id) ?? emailMap.get(membership.user_id) ?? membership.user_id,
    email: emailMap.get(membership.user_id) ?? "",
  }));
}

export async function addStaffMember(
  libraryId: string,
  userId: string,
  role: LibraryRole,
  assignedBy: string,
): Promise<StaffServiceResult> {
  const supabase = createServiceRoleClient();
  const { error: membershipError } = await supabase
    .from("library_staff_memberships")
    .insert({
      assigned_by: assignedBy,
      library_id: libraryId,
      library_role: role,
      user_id: userId,
    });

  if (membershipError) {
    return {
      code: membershipError.code === "23505" ? "ALREADY_STAFF" : "ADD_FAILED",
      error:
        membershipError.code === "23505"
          ? "User is already a staff member."
          : membershipError.message,
    };
  }

  const { data: existingRole } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "library_staff")
    .eq("library_id", libraryId)
    .maybeSingle();

  if (!existingRole) {
    const { error: roleError } = await supabase.from("user_roles").insert({
      assigned_by: assignedBy,
      library_id: libraryId,
      role: "library_staff",
      user_id: userId,
    });

    if (roleError) {
      return {
        code: "ADD_FAILED",
        error: roleError.message,
      };
    }
  }

  await logAuditEvent({
    action: "library_staff_added",
    metadata: {
      libraryId,
      role,
      userId,
    },
    targetId: libraryId,
    targetType: "library",
    userId: assignedBy,
  });

  return { success: true };
}

export async function removeStaffMember(
  libraryId: string,
  userId: string,
): Promise<StaffServiceResult> {
  const supabase = createServiceRoleClient();
  const membership = await getMembership(libraryId, userId);

  if (!membership) {
    return {
      code: "NOT_FOUND",
      error: "Staff member not found.",
    };
  }

  if (membership.libraryRole === "owner" && (await countOwners(libraryId)) === 1) {
    return {
      code: "LAST_OWNER",
      error: "At least one owner must remain assigned to the library.",
    };
  }

  const { error: deleteMembershipError } = await supabase
    .from("library_staff_memberships")
    .delete()
    .eq("library_id", libraryId)
    .eq("user_id", userId);

  if (deleteMembershipError) {
    return {
      code: "REMOVE_FAILED",
      error: deleteMembershipError.message,
    };
  }

  await supabase
    .from("user_roles")
    .delete()
    .eq("library_id", libraryId)
    .eq("user_id", userId)
    .eq("role", "library_staff");

  await logAuditEvent({
    action: "library_staff_removed",
    metadata: {
      libraryId,
      removedUserId: userId,
    },
    targetId: libraryId,
    targetType: "library",
  });

  return { success: true };
}

export async function promoteToOwner(
  libraryId: string,
  userId: string,
): Promise<StaffServiceResult> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("library_staff_memberships")
    .update({
      library_role: "owner",
    })
    .eq("library_id", libraryId)
    .eq("user_id", userId)
    .eq("library_role", "staff");

  if (error) {
    return {
      code: "PROMOTION_FAILED",
      error: error.message,
    };
  }

  await logAuditEvent({
    action: "library_staff_promoted",
    metadata: {
      libraryId,
      promotedUserId: userId,
    },
    targetId: libraryId,
    targetType: "library",
  });

  return { success: true };
}

export async function selfDemoteToStaff(
  libraryId: string,
  userId: string,
): Promise<StaffServiceResult> {
  const membership = await getMembership(libraryId, userId);

  if (!membership) {
    return {
      code: "NOT_FOUND",
      error: "Membership not found.",
    };
  }

  if (membership.libraryRole === "owner" && (await countOwners(libraryId)) === 1) {
    return {
      code: "LAST_OWNER",
      error: "You are the last owner for this library.",
    };
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("library_staff_memberships")
    .update({
      library_role: "staff",
    })
    .eq("library_id", libraryId)
    .eq("user_id", userId)
    .eq("library_role", "owner");

  if (error) {
    return {
      code: "DEMOTION_FAILED",
      error: error.message,
    };
  }

  await logAuditEvent({
    action: "library_owner_demoted",
    metadata: {
      libraryId,
      userId,
    },
    targetId: libraryId,
    targetType: "library",
    userId,
  });

  return { success: true };
}

export async function getMembership(
  libraryId: string,
  userId: string,
): Promise<LibraryStaffMembership | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("library_staff_memberships")
    .select("id, library_id, user_id, library_role, assigned_by, created_at")
    .eq("library_id", libraryId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapMembership(data);
}
