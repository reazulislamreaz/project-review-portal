"use client";

import { RequireAuth } from "@/components/auth/require-auth";
import { AppShell } from "@/components/layout/app-shell";
import { StudentDashboard } from "@/components/student/student-dashboard";

function StudentHomeContent() {
  return (
    <AppShell title="Student portal">
      <StudentDashboard />
    </AppShell>
  );
}

export default function StudentPage() {
  return (
    <RequireAuth role="STUDENT">
      <StudentHomeContent />
    </RequireAuth>
  );
}
