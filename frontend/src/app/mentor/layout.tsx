"use client";

import { RequireAuth } from "@/components/auth/require-auth";
import { AppShell } from "@/components/layout/app-shell";
import { LoadingState } from "@/components/feedback/loading-state";

export default function MentorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppShell title="Mentor portal" wide>
      <RequireAuth
        role="MENTOR"
        fallback={<LoadingState variant="panel" label="Checking your session..." />}
      >
        <div className="page-content">{children}</div>
      </RequireAuth>
    </AppShell>
  );
}
