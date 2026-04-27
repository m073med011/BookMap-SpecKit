import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/config/env";
import type { Database } from "@/types/supabase";

type RoleClaim = {
  libraryId: string | null;
  role: string;
};

export async function updateSessionAndCheckAuth(
  request: NextRequest,
): Promise<{
  response: NextResponse;
  roles: RoleClaim[];
  supabase: SupabaseClient<Database>;
  user: User | null;
}> {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, options, value }) => {
            response.cookies.set(name, value, options);
          });

          Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const roles = ((user?.app_metadata?.roles as RoleClaim[] | undefined) ?? []).map(
    (entry) => ({
      libraryId:
        typeof entry?.libraryId === "string"
          ? entry.libraryId
          : typeof (entry as { library_id?: string | null })?.library_id ===
              "string"
            ? (entry as { library_id?: string | null }).library_id ?? null
            : null,
      role: entry?.role ?? "",
    }),
  );

  return {
    response,
    roles,
    supabase,
    user,
  };
}
