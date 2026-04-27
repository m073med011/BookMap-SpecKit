"use server";

import { createClient } from "@/lib/supabase/server";
import { requireLibraryOwner } from "@/features/roles/services/authorize";
import { resubmitLibrarySchema } from "../schemas/library";
import { transitionLibraryStatus } from "../services/library-service";

export async function resubmitLibraryAction(input: unknown) {
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

  const validation = resubmitLibrarySchema.safeParse(input);

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
      error: "You do not have permission to resubmit this library.",
    };
  }

  return transitionLibraryStatus(validation.data.libraryId, "draft", user.id);
}
