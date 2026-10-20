"use client";

import { RequireAuth } from "@/components/auth/require-auth";
import { AppShell } from "@/components/layout/app-shell";
import { MentorDashboard } from "@/components/mentor/mentor-dashboard";

function MentorHomeContent() {
  return (
    <AppShell title="Mentor portal" wide>
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
