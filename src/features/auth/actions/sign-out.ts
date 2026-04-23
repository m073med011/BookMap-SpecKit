"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signOut } from "@/features/auth/services/auth-service";
import { defaultLocale, locales } from "@/types";

function extractLocaleFromReferer(referer: string | null): string {
  if (!referer) {
    return defaultLocale;
  }

  try {
    const pathname = new URL(referer).pathname;
    const locale = pathname.split("/").filter(Boolean)[0];

    if (locale && locales.includes(locale as (typeof locales)[number])) {
      return locale;
    }
  } catch {
    return defaultLocale;
  }

  return defaultLocale;
}

export async function signOutAction() {
  await signOut();

  const headerStore = await headers();
  const locale = extractLocaleFromReferer(headerStore.get("referer"));

  redirect(`/${locale}/auth/sign-in`);
}
