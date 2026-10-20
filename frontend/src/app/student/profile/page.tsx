"use client";

import Link from "next/link";
import { RequireAuth } from "@/components/auth/require-auth";
import { Alert } from "@/components/feedback/alert";
import { CardSkeleton } from "@/components/feedback/skeleton";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";
import { formatSubmissionDate } from "@/lib/mentor/format";

function StudentProfileContent() {
  const { user, status } = useAuth();

  if (status === "loading" || !user) {
    return (
      <AppShell title="Student portal">
        <div className="space-y-6">
          <PageHeader title="Your profile" />
          <CardSkeleton />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Student portal">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <PageHeader
            title="Your profile"
            description="Account details for your student login."
          />
          <Link
            href="/student"
            className="inline-flex h-9 shrink-0 items-center self-start rounded-md border border-border-strong bg-surface px-3 text-sm font-medium text-foreground hover:bg-muted"
          >
            Back to dashboard
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle as="h2">Account</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-border border-t border-border text-sm">
              <div className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
                <dt className="font-medium text-foreground">Name</dt>
                <dd className="text-subtle">{user.name}</dd>
              </div>
              <div className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
                <dt className="font-medium text-foreground">Email</dt>
                <dd className="break-all text-subtle">{user.email}</dd>
              </div>
              <div className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
                <dt className="font-medium text-foreground">Role</dt>
                <dd className="text-subtle">Student</dd>
              </div>
              <div className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
                <dt className="font-medium text-foreground">Member since</dt>
                <dd className="text-subtle">
                  {user.createdAt ? formatSubmissionDate(user.createdAt) : "—"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Alert variant="info">
          Profile editing is not part of this assignment. Contact an administrator if your
          details need to change.
        </Alert>
      </div>
    </AppShell>
  );
}

export default function StudentProfilePage() {
  return (
    <RequireAuth role="STUDENT">
      <StudentProfileContent />
    </RequireAuth>
  );
}
