import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/config/env";
import { getRoleRedirectPath } from "@/features/roles/services/role-service";
import type { Database } from "@/types/supabase";

type CallbackRouteContext = {
  params: Promise<{ locale: string }>;
};

function applySupabaseResponseState(
  headers: Headers,
  cookiesToSet: Array<{
    name: string;
    options: Parameters<NextResponse["cookies"]["set"]>[2];
    value: string;
  }>,
  response: NextResponse,
) {
  cookiesToSet.forEach(({ name, options, value }) => {
    response.cookies.set(name, value, options);
  });

  headers.forEach((value, key) => {
    response.headers.set(key, value);
  });
}

export async function GET(
  request: NextRequest,
  { params }: CallbackRouteContext,
) {
  const { locale } = await params;
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const responseHeaders = new Headers();
  const responseCookies: Array<{
    name: string;
    options: Parameters<NextResponse["cookies"]["set"]>[2];
    value: string;
  }> = [];

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach((cookie) => {
            responseCookies.push(cookie);
          });

          Object.entries(headers).forEach(([key, value]) => {
            responseHeaders.set(key, value);
          });
        },
      },
    },
  );

  if (!code) {
    return NextResponse.redirect(
      new URL(`/${locale}/auth/error?error=callback_failed`, request.url),
    );
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(
      new URL(`/${locale}/auth/error?error=callback_failed`, request.url),
    );
  }

  const roles =
    (data.user.app_metadata?.roles as
      | Array<{ libraryId?: string | null; library_id?: string | null; role: string }>
      | undefined
    )?.map((entry) => ({
      libraryId: entry.libraryId ?? entry.library_id ?? null,
      role: entry.role,
    })) ?? [];

  const redirectTarget =
    next && next.startsWith("/") ? next : getRoleRedirectPath(roles, locale);
  const response = NextResponse.redirect(new URL(redirectTarget, request.url));

  applySupabaseResponseState(responseHeaders, responseCookies, response);

  return response;
}
