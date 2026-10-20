"use client";

import { RequireAuth } from "@/components/auth/require-auth";
import { AppShell } from "@/components/layout/app-shell";
import { MentorDashboard } from "@/components/mentor/mentor-dashboard";
import { useAuth } from "@/lib/auth/auth-context";

function MentorHomeContent() {
  const { user } = useAuth();

  return (
    <AppShell title="Mentor portal" wide>
      <div className="space-y-2 pb-4">
        <p className="text-sm text-slate-600">
          Signed in as {user?.name ?? "mentor"} ({user?.email})
        </p>
      </div>
      <MentorDashboard />
    </AppShell>
  );
}

export default function MentorPage() {
  return (
    <RequireAuth role="MENTOR">
      <MentorHomeContent />
    </RequireAuth>
  );
}
