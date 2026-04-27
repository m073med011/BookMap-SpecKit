"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/lib/i18n/routing";
import { hasRole } from "@/lib/auth/permissions";
import type { LibraryWithRole } from "@/features/libraries/services/library-service";
import type { Locale } from "@/types";
import { cn } from "@/lib/utils/cn";

type RoleClaim = {
  libraryId: string | null;
  role: string;
};

type SidebarProps = {
  libraries: LibraryWithRole[];
  roles: RoleClaim[];
};

const navIcons = {
  admin: "#",
  dashboard: "[]",
  home: "o",
  libraryManagement: "=",
  profile: "@",
};

export function Sidebar({ libraries, roles }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const t = useTranslations("nav");
  const appName = useTranslations("common");
  const librariesT = useTranslations("libraries.myLibraries");
  const collapseLabel = collapsed ? ">" : "<";
  const collapseIcon =
    locale === "ar"
      ? collapseLabel.split("").reverse().join("")
      : collapseLabel;
  const navigationItems = [
    {
      href: "/",
      icon: navIcons.home,
      label: t("home"),
      visible: true,
    },
    {
      href: "/dashboard",
      icon: navIcons.dashboard,
      label: t("dashboard"),
      visible: true,
    },
    {
      href: "/dashboard/profile",
      icon: navIcons.profile,
      label: t("profile"),
      visible: true,
    },
    {
      href: "/dashboard/admin",
      icon: navIcons.admin,
      label: t("admin"),
      visible: hasRole(roles, "admin") || hasRole(roles, "superadmin"),
    },
    {
      href: "/dashboard/libraries",
      icon: navIcons.libraryManagement,
      label: t("myLibraries"),
      visible: true,
    },
  ].filter((item) => item.visible);

  return (
    <aside
      className={cn(
        "bg-background sticky top-0 flex h-screen flex-col border-e transition-[width]",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex items-center gap-3 border-b py-4 ps-4 pe-4">
        <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl">
          BM
        </div>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate font-semibold">{appName("appName")}</p>
            <p className="text-muted-foreground text-xs">{t("dashboard")}</p>
          </div>
        ) : null}
      </div>

      <nav className="flex-1 space-y-2 py-4 ps-3 pe-3">
        {navigationItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              className={cn(
                "text-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-lg py-2.5 ps-3 pe-3 text-sm font-medium transition-colors",
                isActive && "bg-accent text-accent-foreground",
              )}
              href={item.href}
              key={item.href}
            >
              <span aria-hidden="true">{item.icon}</span>
              {!collapsed ? <span>{item.label}</span> : null}
            </Link>
          );
        })}

        {!collapsed ? (
          <div className="space-y-2 pt-4">
            <div className="px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {librariesT("title")}
            </div>
            {libraries.length === 0 ? (
              <p className="px-3 text-sm text-muted-foreground">
                {librariesT("noLibraries")}
              </p>
            ) : (
              libraries.slice(0, 5).map((library) => {
                const href = `/dashboard/libraries/${library.id}`;
                const isActive = pathname === href || pathname.startsWith(`${href}/`);

                return (
                  <Link
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                      isActive && "bg-accent text-accent-foreground",
                    )}
                    href={href}
                    key={library.id}
                  >
                    <span className="truncate">{library.name}</span>
                    <span className="text-xs uppercase text-muted-foreground">
                      {library.role}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        ) : null}
      </nav>

      <div className="border-t p-3">
        <button
          className="hover:bg-accent hover:text-accent-foreground flex w-full items-center justify-center rounded-lg border py-2 text-sm font-medium transition-colors"
          onClick={() => setCollapsed((value) => !value)}
          type="button"
        >
          {collapseIcon}
        </button>
      </div>
    </aside>
  );
}
