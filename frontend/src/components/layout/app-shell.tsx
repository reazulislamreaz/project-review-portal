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
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div
          className={cn(
            "mx-auto flex items-center justify-between gap-4 px-4 py-4 sm:px-6",
            widthClass,
          )}
        >
          <div>
            <Link href="/" className="text-sm font-semibold text-slate-900">
              Project Submission Dashboard
            </Link>
            <p className="mt-0.5 text-xs text-slate-500">{title}</p>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <p className="hidden text-sm text-slate-600 sm:block">
                {user.name} · {user.role === "MENTOR" ? "Mentor" : "Student"}
              </p>
            ) : null}
            <Button type="button" variant="outline" size="sm" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main className={cn("mx-auto px-4 py-8 sm:px-6", widthClass)}>{children}</main>
    </div>
  );
}
