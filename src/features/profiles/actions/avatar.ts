"use server";

import { createClient } from "@/lib/supabase/server";
import {
  removeAvatar,
  uploadAvatar,
} from "@/features/profiles/services/profile-service";

export async function uploadAvatarAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      code: "UNAUTHORIZED",
      error: "Unauthorized",
    };
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return {
      code: "INVALID_TYPE",
      error: "A file is required.",
    };
  }

  return uploadAvatar(user.id, file);
}

export async function removeAvatarAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "Unauthorized",
    };
  }

  return removeAvatar(user.id);
}
