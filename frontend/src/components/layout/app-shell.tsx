"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";

type AppShellProps = {
  title: string;
  children: ReactNode;
  wide?: boolean;
};

export function AppShell({ title, children, wide = false }: AppShellProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const widthClass = wide ? "max-w-6xl" : "max-w-3xl";

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div
          className={cn(
            "mx-auto flex items-center justify-between gap-4 px-4 py-3.5 sm:px-6",
            widthClass,
          )}
        >
          <div className="min-w-0">
            <Link
              href="/"
              className="text-sm font-semibold text-foreground hover:text-primary-hover"
            >
              Project Submission Dashboard
            </Link>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{title}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {user ? (
              <p className="hidden text-sm text-subtle sm:block">
                {user.name}
                <span className="text-muted-foreground">
                  {" "}
                  · {user.role === "MENTOR" ? "Mentor" : "Student"}
                </span>
              </p>
            ) : null}
            <Button type="button" variant="outline" size="sm" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main className={cn("mx-auto px-4 py-8 sm:px-6 sm:py-10", widthClass)}>{children}</main>
    </div>
  );
}
