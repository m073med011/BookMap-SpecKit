import type { ReactNode } from "react";
import { Sidebar } from "@/components/shared/app-shell/Sidebar";
import { ErrorBoundary } from "@/components/ui/feedback/ErrorBoundary";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="bg-muted/20 flex min-h-screen">
      <ErrorBoundary>
        <Sidebar />
      </ErrorBoundary>
      <ErrorBoundary>
        <div className="flex flex-1 flex-col">
          <header className="bg-background border-b px-6 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-sm">
                  BookMap / Dashboard
                </p>
                <h1 className="text-xl font-semibold">Foundation shell</h1>
              </div>
              <div className="text-muted-foreground rounded-full border px-3 py-1 text-sm">
                Actions
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </ErrorBoundary>
    </div>
  );
}
