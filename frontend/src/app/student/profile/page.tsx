"use client";

import { Alert } from "@/components/feedback/alert";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";
import { formatSubmissionDate } from "@/lib/mentor/format";

export default function StudentProfilePage() {
  const { user } = useAuth();

  return (
    <div className="w-full min-w-0 space-y-8">
      <PageHeader
        title="Your profile"
        description="Account details for your student login."
      />

      {!user ? null : (
        <>
          <Card className="w-full min-w-0 overflow-hidden">
            <CardHeader>
              <CardTitle as="h2">Account</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-border border-t border-border text-sm">
                <div className="grid gap-1 py-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4">
                  <dt className="font-medium text-foreground">Name</dt>
                  <dd className="min-w-0 break-words text-subtle">{user.name}</dd>
                </div>
                <div className="grid gap-1 py-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4">
                  <dt className="font-medium text-foreground">Email</dt>
                  <dd className="min-w-0 break-all text-subtle">{user.email}</dd>
                </div>
                <div className="grid gap-1 py-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4">
                  <dt className="font-medium text-foreground">Role</dt>
                  <dd className="text-subtle">Student</dd>
                </div>
                <div className="grid gap-1 py-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4">
                  <dt className="font-medium text-foreground">Member since</dt>
                  <dd className="min-w-0 text-subtle">
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
        </>
      )}
    </div>
  );
}
