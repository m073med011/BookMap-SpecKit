"use server";

import { createClient } from "@/lib/supabase/server";
import { requireLibraryStaff } from "@/features/roles/services/authorize";
import { updateLibrarySchema } from "../schemas/library";
import { updateLibrary } from "../services/library-service";

export async function updateLibraryAction(input: unknown) {
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

  const validation = updateLibrarySchema.safeParse(input);

  if (!validation.success) {
    return {
      code: "INVALID_INPUT",
      error: validation.error.issues[0]?.message ?? "Invalid library data.",
    };
  }

  try {
    await requireLibraryStaff(validation.data.libraryId);
  } catch {
    return {
      code: "UNAUTHORIZED",
      error: "You do not have permission to update this library.",
    };
  }

  const { libraryId, ...payload } = validation.data;
  return updateLibrary(libraryId, payload);
}
