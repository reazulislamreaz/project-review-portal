"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";

type AppShellProps = {
  title: string;
  children: React.ReactNode;
};

export function AppShell({ title, children }: AppShellProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
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
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
