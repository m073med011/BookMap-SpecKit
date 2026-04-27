import "server-only";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/features/auth/services/audit-service";
import {
  AVATAR_ALLOWED_MIME_TYPES,
  AVATAR_MAX_SIZE_BYTES,
  avatarUploadSchema,
  updateProfileSchema,
} from "@/features/profiles/schemas/profile";
import type { Profile } from "@/features/auth/types";
import type { Database } from "@/types/supabase";

type UpdateProfileInput = {
  bio?: string;
  displayName?: string;
  preferredLocale?: "en" | "ar";
};

function mapProfile(row: {
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  display_name: string;
  id: string;
  preferred_locale: "en" | "ar";
  status: "active" | "suspended";
  updated_at: string;
}): Profile {
  return {
    avatarUrl: row.avatar_url,
    bio: row.bio,
    createdAt: row.created_at,
    displayName: row.display_name,
    id: row.id,
    preferredLocale: row.preferred_locale,
    status: row.status,
    updatedAt: row.updated_at,
  };
}

function getAvatarExtension(mimeType: string) {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return null;
  }
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, display_name, bio, preferred_locale, avatar_url, status, created_at, updated_at",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapProfile(data);
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<{ success: true; profile: Profile } | { error: string }> {
  const validatedInput = updateProfileSchema.safeParse(input);

  if (!validatedInput.success) {
    return {
      error: validatedInput.error.issues[0]?.message ?? "Invalid profile data.",
    };
  }

  const payload: Database["public"]["Tables"]["profiles"]["Update"] = {};

  if (validatedInput.data.bio !== undefined) {
    payload.bio = validatedInput.data.bio;
  }

  if (validatedInput.data.displayName !== undefined) {
    payload.display_name = validatedInput.data.displayName;
  }

  if (validatedInput.data.preferredLocale !== undefined) {
    payload.preferred_locale = validatedInput.data.preferredLocale;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", userId)
    .select(
      "id, display_name, bio, preferred_locale, avatar_url, status, created_at, updated_at",
    )
    .single();

  if (error || !data) {
    return {
      error: error?.message ?? "Unable to update the profile.",
    };
  }

  await logAuditEvent({
    action: "profile_updated",
    targetId: userId,
    targetType: "profile",
    userId,
  });

  return {
    profile: mapProfile(data),
    success: true,
  };
}

export async function uploadAvatar(
  userId: string,
  file: File,
): Promise<{ success: true; avatarUrl: string } | { code: string; error: string }> {
  const validation = avatarUploadSchema.safeParse({
    size: file.size,
    type: file.type,
  });

  if (!validation.success) {
    const issue = validation.error.issues[0];
    return {
      code: issue?.path[0] === "size" ? "FILE_TOO_LARGE" : "INVALID_TYPE",
      error: issue?.message ?? "Invalid file.",
    };
  }

  if (!AVATAR_ALLOWED_MIME_TYPES.includes(file.type as (typeof AVATAR_ALLOWED_MIME_TYPES)[number])) {
    return {
      code: "INVALID_TYPE",
      error: "Unsupported file type.",
    };
  }

  if (file.size > AVATAR_MAX_SIZE_BYTES) {
    return {
      code: "FILE_TOO_LARGE",
      error: "File is too large.",
    };
  }

  const extension = getAvatarExtension(file.type);

  if (!extension) {
    return {
      code: "INVALID_TYPE",
      error: "Unsupported file type.",
    };
  }

  const path = `${userId}/avatar.${extension}`;
  const supabase = await createClient();
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return {
      code: "UPLOAD_FAILED",
      error: uploadError.message,
    };
  }

  const { data: publicUrlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      avatar_url: publicUrlData.publicUrl,
    })
    .eq("id", userId);

  if (updateError) {
    return {
      code: "UPLOAD_FAILED",
      error: updateError.message,
    };
  }

  await logAuditEvent({
    action: "avatar_uploaded",
    targetId: userId,
    targetType: "profile",
    userId,
  });

  return {
    avatarUrl: publicUrlData.publicUrl,
    success: true,
  };
}

export async function removeAvatar(
  userId: string,
): Promise<{ success: true }> {
  const supabase = await createClient();
  await supabase.storage
    .from("avatars")
    .remove([
      `${userId}/avatar.jpg`,
      `${userId}/avatar.png`,
      `${userId}/avatar.webp`,
    ]);

  await supabase
    .from("profiles")
    .update({
      avatar_url: null,
    })
    .eq("id", userId);

  await logAuditEvent({
    action: "avatar_removed",
    targetId: userId,
    targetType: "profile",
    userId,
  });

  return { success: true };
}
