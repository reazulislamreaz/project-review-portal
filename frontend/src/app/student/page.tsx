"use client";

import { useState } from "react";
import { RequireAuth } from "@/components/auth/require-auth";
import { Alert } from "@/components/feedback/alert";
import { AppShell } from "@/components/layout/app-shell";
import { SubmissionForm } from "@/components/student/submission-form";
import { SubmissionSuccess } from "@/components/student/submission-success";
import type { SafeSubmission } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";

function StudentHomeContent() {
  const { user } = useAuth();
  const [submission, setSubmission] = useState<SafeSubmission | null>(null);

  return (
    <AppShell title="Student portal">
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Welcome{user ? `, ${user.name}` : ""}
          </h2>
          <p className="text-sm text-slate-600">
            Submit your project details for mentor review. Only one submission is allowed
            per student account.
          </p>
        </div>

        {submission ? (
          <>
            <SubmissionSuccess submission={submission} />
            <Alert variant="info">
              Reloading this page shows the form again because there is no student “own
              submission” API yet. A second submit still returns a conflict from the
              backend (one submission per student).
            </Alert>
          </>
        ) : (
          <SubmissionForm onSuccess={setSubmission} />
        )}
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
