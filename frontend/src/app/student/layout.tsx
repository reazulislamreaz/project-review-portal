"use client";

import { RequireAuth } from "@/components/auth/require-auth";
import { AppShell } from "@/components/layout/app-shell";
import { SectionNav } from "@/components/layout/section-nav";
import { LoadingState } from "@/components/feedback/loading-state";

const studentNav = [
  { href: "/student", label: "Dashboard", exact: true },
  { href: "/student/profile", label: "Profile" },
] as const;

export default function StudentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppShell title="Student portal" wide>
      <div className="mx-auto w-full min-w-0">
        <SectionNav items={studentNav} label="Student" />
        <RequireAuth
          role="STUDENT"
          fallback={
            <LoadingState variant="panel" label="Checking your session..." />
          }
        >
          {/* Stable content slot — same width/overflow on every student route */}
          <div className="min-w-0">{children}</div>
        </RequireAuth>
      </div>
    </AppShell>
  );
}
