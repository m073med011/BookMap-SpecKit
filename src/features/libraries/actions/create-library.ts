"use server";

import { createClient } from "@/lib/supabase/server";
import { createLibrarySchema } from "../schemas/library";
import { createLibrary } from "../services/library-service";

export async function createLibraryAction(input: unknown) {
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

  const validation = createLibrarySchema.safeParse(input);

  if (!validation.success) {
    return {
      code: "INVALID_INPUT",
      error: validation.error.issues[0]?.message ?? "Invalid library data.",
    };
  }

  const result = await createLibrary({
    ...validation.data,
    ownerId: user.id,
  });

  if ("code" in result && result.code === "SLUG_TAKEN") {
    return {
      code: "SLUG_TAKEN",
      error: "This library URL is already taken.",
    };
  }

  return result;
}
