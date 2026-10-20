"use client";

import { RequireAuth } from "@/components/auth/require-auth";
import { Alert } from "@/components/feedback/alert";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth/auth-context";

function StudentHomeContent() {
  const { user } = useAuth();

  return (
    <AppShell title="Student portal">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          Welcome{user ? `, ${user.name}` : ""}
        </h2>
        <Alert variant="info" title="Student submission comes next">
          Authentication is ready. The project submission form will be added in B6.2.
        </Alert>
      </div>
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
