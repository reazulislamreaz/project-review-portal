"use client";

import { RequireAuth } from "@/components/auth/require-auth";
import { Alert } from "@/components/feedback/alert";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/lib/auth/auth-context";

function MentorHomeContent() {
  const { user } = useAuth();

  return (
    <AppShell title="Mentor portal">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          Welcome{user ? `, ${user.name}` : ""}
        </h2>
        <Alert variant="info" title="Review dashboard comes next">
          Authentication is ready. The mentor review dashboard will be added in a later phase.
        </Alert>
      </div>
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
