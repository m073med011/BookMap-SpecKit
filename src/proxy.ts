import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { getRoleRedirectPath } from "@/features/roles/services/role-service";
import { updateSessionAndCheckAuth } from "@/lib/auth/middleware";
import { hasRole } from "@/lib/auth/permissions";
import routing from "@/lib/i18n/routing";
import { defaultLocale, locales } from "@/types";

const handleI18nRouting = createMiddleware(routing);

type RoleClaim = {
  libraryId: string | null;
  role: string;
};

function extractLocale(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  const candidate = segments[0];

  return candidate && locales.includes(candidate as (typeof locales)[number])
    ? candidate
    : null;
}

function copyHeaders(from: NextResponse, to: NextResponse) {
  from.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      return;
    }

    to.headers.set(key, value);
  });
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
}

function redirectWithState(url: URL, baseResponse: NextResponse) {
  const response = NextResponse.redirect(url);
  copyHeaders(baseResponse, response);
  copyCookies(baseResponse, response);
  return response;
}

export async function proxy(request: NextRequest) {
  const localeResponse = handleI18nRouting(request);
  const locale = extractLocale(request.nextUrl.pathname);

  if (!locale) {
    return localeResponse;
  }

  const pathnameWithoutLocale = request.nextUrl.pathname.replace(
    `/${locale}`,
    "",
  ) || "/";
  const isAuthRoute = pathnameWithoutLocale.startsWith("/auth");
  const isDashboardRoute = pathnameWithoutLocale.startsWith("/dashboard");

  if (!isAuthRoute && !isDashboardRoute) {
    return localeResponse;
  }

  const { response, roles, supabase, user } =
    await updateSessionAndCheckAuth(request);

  copyHeaders(localeResponse, response);

  if (!user && isDashboardRoute) {
    const signInUrl = request.nextUrl.clone();
    signInUrl.pathname = `/${locale}/auth/sign-in`;
    signInUrl.searchParams.set("next", request.nextUrl.pathname);

    return redirectWithState(signInUrl, response);
  }

  const normalizedRoles = roles as RoleClaim[];

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.status === "suspended") {
      await supabase.auth.signOut();

      const suspendedUrl = request.nextUrl.clone();
      suspendedUrl.pathname = `/${locale}/auth/sign-in`;
      suspendedUrl.searchParams.set("error", "account_suspended");

      return redirectWithState(suspendedUrl, response);
    }
  }

  if (user && isAuthRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = getRoleRedirectPath(normalizedRoles, locale);

    return redirectWithState(redirectUrl, response);
  }

  if (
    user &&
    pathnameWithoutLocale.startsWith("/dashboard/admin") &&
    !hasRole(normalizedRoles, "admin") &&
    !hasRole(normalizedRoles, "superadmin")
  ) {
    const forbiddenUrl = request.nextUrl.clone();
    forbiddenUrl.pathname = getRoleRedirectPath(normalizedRoles, locale);
    forbiddenUrl.searchParams.set("error", "forbidden");

    return redirectWithState(forbiddenUrl, response);
  }

  if (user && pathnameWithoutLocale.startsWith("/dashboard/library/")) {
    const libraryId = pathnameWithoutLocale.split("/")[3] ?? null;

    if (
      libraryId &&
      !hasRole(normalizedRoles, "library_staff", libraryId) &&
      !hasRole(normalizedRoles, "admin") &&
      !hasRole(normalizedRoles, "superadmin")
    ) {
      const unauthorizedUrl = request.nextUrl.clone();
      unauthorizedUrl.pathname = getRoleRedirectPath(normalizedRoles, locale);
      unauthorizedUrl.searchParams.set("error", "forbidden");

      return redirectWithState(unauthorizedUrl, response);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
