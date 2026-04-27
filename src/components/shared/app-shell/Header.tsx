import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/routing";
import { signOutAction } from "@/features/auth/actions/sign-out";
import type { Profile } from "@/features/auth/types";
import { HeaderActions } from "./HeaderActions";

type HeaderProps = {
  isAuthenticated?: boolean;
  profile?: Profile | null;
  userEmail?: string | null;
};

function getInitials(displayName: string) {
  return displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export async function Header({
  isAuthenticated = false,
  profile = null,
  userEmail = null,
}: HeaderProps) {
  const common = await getTranslations("common");
  const nav = await getTranslations("nav");
  const displayName = profile?.displayName || userEmail || common("appName");
  const initials = getInitials(displayName) || "BM";

  return (
    <header className="bg-background/95 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="flex items-center justify-between py-3 ps-4 pe-4">
        <Link className="text-lg font-semibold tracking-tight" href="/">
          {common("appName")}
        </Link>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <details className="group relative">
              <summary className="hover:bg-accent hover:text-accent-foreground flex cursor-pointer list-none items-center gap-3 rounded-full border px-2 py-1.5 text-sm transition-colors">
                {profile?.avatarUrl ? (
                  <img
                    alt={displayName}
                    className="h-9 w-9 rounded-full object-cover"
                    height="36"
                    src={profile.avatarUrl}
                    width="36"
                  />
                ) : (
                  <span className="bg-primary/10 text-primary inline-flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold">
                    {initials}
                  </span>
                )}
                <span className="hidden text-start sm:block">
                  <span className="block max-w-40 truncate font-medium">
                    {displayName}
                  </span>
                  <span className="text-muted-foreground block max-w-40 truncate text-xs">
                    {userEmail}
                  </span>
                </span>
              </summary>
              <div className="bg-background absolute end-0 top-[calc(100%+0.5rem)] w-56 rounded-xl border p-2 shadow-lg">
                <Link
                  className="hover:bg-accent hover:text-accent-foreground flex rounded-lg px-3 py-2 text-sm transition-colors"
                  href="/dashboard/profile"
                >
                  {nav("profileSettings")}
                </Link>
                <form action={signOutAction}>
                  <button
                    className="hover:bg-accent hover:text-accent-foreground flex w-full rounded-lg px-3 py-2 text-left text-sm transition-colors"
                    type="submit"
                  >
                    {nav("signOut")}
                  </button>
                </form>
              </div>
            </details>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium transition-colors"
                href="/auth/sign-in"
              >
                {nav("signIn")}
              </Link>
              <Link
                className="bg-primary text-primary-foreground inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-opacity hover:opacity-90"
                href="/auth/sign-up"
              >
                {nav("signUp")}
              </Link>
            </div>
          )}
          <HeaderActions />
        </div>
      </div>
    </header>
  );
}
