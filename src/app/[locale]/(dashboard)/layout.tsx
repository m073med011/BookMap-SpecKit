import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Header } from "@/components/shared/app-shell/Header";
import { Sidebar } from "@/components/shared/app-shell/Sidebar";
import { ErrorBoundary } from "@/components/ui/feedback/ErrorBoundary";
import { getLibrariesForUser } from "@/features/libraries/services/library-service";
import { getProfile } from "@/features/profiles/services/profile-service";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/types";

type DashboardLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

type RoleClaim = {
  libraryId: string | null;
  role: string;
};

function normalizeRoles(
  roles:
    | Array<{ libraryId?: string | null; library_id?: string | null; role: string }>
    | undefined,
): RoleClaim[] {
  return (
    roles?.map((entry) => ({
      libraryId: entry.libraryId ?? entry.library_id ?? null,
      role: entry.role,
    })) ?? []
  );
}

export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const locale = (await params).locale as Locale;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/sign-in`);
  }

  const profile = await getProfile(user.id);
  const libraries = await getLibrariesForUser(user.id);
  const roles = normalizeRoles(
    user.app_metadata?.roles as
      | Array<{ libraryId?: string | null; library_id?: string | null; role: string }>
      | undefined,
  );

  return (
    <div className="bg-muted/20 flex min-h-screen">
      <ErrorBoundary>
        <Sidebar libraries={libraries} roles={roles} />
      </ErrorBoundary>
      <ErrorBoundary>
        <div className="flex flex-1 flex-col">
          <Header
            isAuthenticated
            profile={profile}
            userEmail={user.email ?? null}
          />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </ErrorBoundary>
    </div>
  );
}
