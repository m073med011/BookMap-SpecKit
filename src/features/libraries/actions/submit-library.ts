"use server";

import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/features/profiles/services/profile-service";
import { requireLibraryOwner } from "@/features/roles/services/authorize";
import { submitLibrarySchema } from "../schemas/library";
import { getLibrary, transitionLibraryStatus } from "../services/library-service";

export async function submitLibraryAction(input: unknown) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      code: "UNAUTHORIZED",
      error: "You must be signed in.",
    };
  }

  const validation = submitLibrarySchema.safeParse(input);

  if (!validation.success) {
    return {
      code: "INVALID_INPUT",
      error: validation.error.issues[0]?.message ?? "Invalid library.",
    };
  }

  try {
    await requireLibraryOwner(validation.data.libraryId);
  } catch {
    return {
      code: "UNAUTHORIZED",
      error: "You do not have permission to submit this library.",
    };
  }

  const library = await getLibrary(validation.data.libraryId);

  if (!library) {
    return {
      code: "NOT_FOUND",
      error: "Library not found.",
    };
  }

  if (!library.name || !library.slug) {
    return {
      code: "INCOMPLETE",
      error: "Please complete all required fields before submitting.",
    };
  }

  const ownerProfile = await getProfile(library.ownerId);

  if (ownerProfile?.status === "suspended") {
    return {
      code: "OWNER_SUSPENDED",
      error: "Cannot submit while your account is suspended.",
    };
  }

  return transitionLibraryStatus(
    validation.data.libraryId,
    "pending_approval",
    user.id,
  );
}
