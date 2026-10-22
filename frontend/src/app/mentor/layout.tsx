"use client";

import { RequireAuth } from "@/components/auth/require-auth";
import { AppShell } from "@/components/layout/app-shell";
import { SectionNav } from "@/components/layout/section-nav";
import { LoadingState } from "@/components/feedback/loading-state";

const mentorNav = [
  { href: "/mentor", label: "Dashboard", exact: true },
  { href: "/mentor/profile", label: "Profile" },
] as const;

export default function MentorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppShell title="Mentor portal" wide>
      <div className="mx-auto w-full min-w-0">
        <SectionNav items={mentorNav} label="Mentor" />
        <RequireAuth
          role="MENTOR"
          fallback={
            <LoadingState variant="panel" label="Checking your session..." />
          }
        >
          <div className="min-w-0">{children}</div>
        </RequireAuth>
      </div>
    </AppShell>
  );
}
