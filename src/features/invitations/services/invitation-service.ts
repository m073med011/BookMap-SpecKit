import "server-only";
import { env } from "@/lib/config/env";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/features/auth/services/audit-service";

type InvitationResult =
  | { success: true }
  | { code: string; error: string };

type AcceptInvitationResult =
  | { success: true; libraryId: string }
  | { code: string; error: string };

async function findUserIdByEmail(email: string): Promise<string | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  if (error) {
    return null;
  }

  const matchedUser = data.users.find(
    (user) => user.email?.toLowerCase() === email.toLowerCase(),
  );

  return matchedUser?.id ?? null;
}

export async function sendStaffInvitation(input: {
  email: string;
  invitedBy: string;
  libraryId: string;
}): Promise<InvitationResult> {
  const supabase = createServiceRoleClient();
  const existingUserId = await findUserIdByEmail(input.email);

  if (existingUserId) {
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", existingUserId)
      .eq("role", "library_staff")
      .eq("library_id", input.libraryId)
      .maybeSingle();

    if (existingRole) {
      return {
        code: "ALREADY_STAFF",
        error: "User is already library staff.",
      };
    }
  }

  const { data: existingInvitation } = await supabase
    .from("staff_invitations")
    .select("id")
    .eq("email", input.email)
    .eq("library_id", input.libraryId)
    .eq("status", "pending")
    .maybeSingle();

  if (existingInvitation) {
    return {
      code: "ALREADY_INVITED",
      error: "A pending invitation already exists.",
    };
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { error } = await supabase.from("staff_invitations").insert({
    email: input.email,
    expires_at: expiresAt,
    invited_by: input.invitedBy,
    library_id: input.libraryId,
    token,
  });

  if (error) {
    return {
      code: "UNKNOWN",
      error: error.message,
    };
  }

  await supabase.auth.admin.inviteUserByEmail(input.email, {
    redirectTo: `${env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/auth/callback?invitation=${token}`,
  });

  await logAuditEvent({
    action: "staff_invitation_sent",
    metadata: {
      email: input.email,
      libraryId: input.libraryId,
    },
    targetType: "invitation",
    userId: input.invitedBy,
  });

  return { success: true };
}

export async function acceptInvitation(input: {
  token: string;
  userId?: string;
}): Promise<AcceptInvitationResult> {
  const sessionSupabase = await createClient();
  const fallbackUserId =
    input.userId ?? (await sessionSupabase.auth.getUser()).data.user?.id;

  if (!fallbackUserId) {
    return {
      code: "UNAUTHORIZED",
      error: "You must be signed in to accept an invitation.",
    };
  }

  const supabase = createServiceRoleClient();
  const { data: invitation, error } = await supabase
    .from("staff_invitations")
    .select("id, library_id, status, expires_at")
    .eq("token", input.token)
    .maybeSingle();

  if (error || !invitation) {
    return {
      code: "INVALID_TOKEN",
      error: "Invitation not found.",
    };
  }

  if (invitation.status === "accepted") {
    return {
      code: "ALREADY_ACCEPTED",
      error: "Invitation already accepted.",
    };
  }

  if (invitation.status !== "pending") {
    return {
      code: "INVALID_TOKEN",
      error: "Invitation is no longer valid.",
    };
  }

  if (new Date(invitation.expires_at).getTime() < Date.now()) {
    await supabase
      .from("staff_invitations")
      .update({
        status: "expired",
      })
      .eq("id", invitation.id);

    return {
      code: "EXPIRED",
      error: "Invitation has expired.",
    };
  }

  const { data: existingRole } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", fallbackUserId)
    .eq("role", "library_staff")
    .eq("library_id", invitation.library_id)
    .maybeSingle();

  if (!existingRole) {
    await supabase.from("user_roles").insert({
      library_id: invitation.library_id,
      role: "library_staff",
      user_id: fallbackUserId,
    });
  }

  await supabase
    .from("staff_invitations")
    .update({
      status: "accepted",
    })
    .eq("id", invitation.id);

  await logAuditEvent({
    action: "staff_invitation_accepted",
    metadata: {
      libraryId: invitation.library_id,
      token: input.token,
    },
    targetId: invitation.id,
    targetType: "invitation",
    userId: fallbackUserId,
  });

  return {
    libraryId: invitation.library_id,
    success: true,
  };
}

export async function revokeInvitation(input: {
  invitationId: string;
  revokedBy: string;
}): Promise<InvitationResult> {
  const sessionSupabase = await createClient();
  const {
    data: { user },
  } = await sessionSupabase.auth.getUser();
  const roles =
    (user?.app_metadata?.roles as
      | Array<{ libraryId?: string | null; library_id?: string | null; role: string }>
      | undefined
    )?.map((entry) => ({
      libraryId: entry.libraryId ?? entry.library_id ?? null,
      role: entry.role,
    })) ?? [];
  const supabase = createServiceRoleClient();
  const { data: invitation, error } = await supabase
    .from("staff_invitations")
    .select("id, invited_by, status")
    .eq("id", input.invitationId)
    .maybeSingle();

  if (error || !invitation) {
    return {
      code: "NOT_PENDING",
      error: "Invitation not found.",
    };
  }

  if (invitation.status !== "pending") {
    return {
      code: "NOT_PENDING",
      error: "Invitation is not pending.",
    };
  }

  const canRevoke =
    invitation.invited_by === input.revokedBy ||
    roles.some((entry) => entry.role === "admin" || entry.role === "superadmin");

  if (!canRevoke) {
    return {
      code: "UNAUTHORIZED",
      error: "Unauthorized",
    };
  }

  await supabase
    .from("staff_invitations")
    .update({
      status: "revoked",
    })
    .eq("id", input.invitationId);

  await logAuditEvent({
    action: "staff_invitation_revoked",
    targetId: input.invitationId,
    targetType: "invitation",
    userId: input.revokedBy,
  });

  return { success: true };
}
