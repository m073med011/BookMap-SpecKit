"use client";

import { LocaleSwitcher } from "@/components/shared/LocaleSwitcher";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export function HeaderActions() {
  return (
    <div className="flex items-center gap-2">
      <LocaleSwitcher />
      <ThemeToggle />
    </div>
  );
}
