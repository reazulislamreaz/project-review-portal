"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAuth } from "@/lib/auth/auth-context";
import { homePathForRole } from "@/lib/auth/routes";
import { cn } from "@/lib/utils";

/** Shared shell width for student and mentor dashboards. */
const SHELL_WIDTH = "max-w-7xl";

type AppShellProps = {
  title: string;
  children: ReactNode;
  /** @deprecated Kept for call-site compatibility; width is always shared. */
  wide?: boolean;
};

export function AppShell({ title, children }: AppShellProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const homeHref = user ? homePathForRole(user.role) : "/";

  function handleLogoutConfirm() {
    setLogoutConfirmOpen(false);
    logout();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-surface">
        <div
          className={cn(
            "mx-auto flex min-h-14 w-full items-center justify-between gap-3 px-4 py-2.5 sm:min-h-[3.75rem] sm:gap-4 sm:px-6",
            SHELL_WIDTH,
          )}
        >
          <div className="min-w-0 flex-1">
            <Link
              href={homeHref}
              className="block truncate text-sm font-semibold text-foreground hover:text-primary-hover"
            >
              Project Submission Dashboard
            </Link>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{title}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <p className="hidden max-w-[12rem] truncate text-sm text-subtle sm:block">
              {user ? (
                <>
                  <span className="text-foreground">{user.name}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {user.role === "MENTOR" ? "Mentor" : "Student"}
                  </span>
                </>
              ) : (
                <span className="invisible" aria-hidden="true">
                  Loading · Student
                </span>
              )}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLogoutConfirmOpen(true)}
            >
              Log out
            </Button>
          </div>
        </div>
      </header>

      <main className={cn("mx-auto w-full flex-1 px-4 py-8 sm:px-6 sm:py-10", SHELL_WIDTH)}>
        {children}
      </main>

      <ConfirmDialog
        open={logoutConfirmOpen}
        title="Log out?"
        description="Are you sure you want to log out of your account?"
        confirmLabel="Log out"
        cancelLabel="Cancel"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setLogoutConfirmOpen(false)}
      />
    </div>
  );
}
