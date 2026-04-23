"use server";

import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "@/features/profiles/services/profile-service";

export async function updateProfileAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "Unauthorized",
    };
  }

  return updateProfile(user.id, {
    bio: String(formData.get("bio") ?? "").trim() || undefined,
    displayName: String(formData.get("displayName") ?? "").trim() || undefined,
    preferredLocale:
      formData.get("preferredLocale") === "ar" ? "ar" : "en",
  });
}
