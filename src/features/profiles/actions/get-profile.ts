"use server";

import { getProfile } from "@/features/profiles/services/profile-service";

export async function getProfileAction(userId: string) {
  return getProfile(userId);
}
