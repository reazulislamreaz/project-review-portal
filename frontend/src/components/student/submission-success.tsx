"use client";

import { Alert } from "@/components/feedback/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SafeSubmission } from "@/lib/api/types";

type SubmissionSuccessProps = {
  submission: SafeSubmission;
};

export function SubmissionSuccess({ submission }: SubmissionSuccessProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Submission received</CardTitle>
        <CardDescription>
          Your project was submitted successfully. Mentors will review it soon.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <Alert variant="success" title={`Status: ${submission.status}`}>
          {submission.status === "PENDING"
            ? "Your submission is pending mentor review."
            : `Current status is ${submission.status}.`}
        </Alert>

        <dl className="divide-y divide-border border-t border-border text-sm">
          <div className="grid gap-1 py-3 sm:grid-cols-[8rem_1fr] sm:gap-4">
            <dt className="font-medium text-foreground">Project name</dt>
            <dd className="text-subtle">{submission.projectName}</dd>
          </div>
          <div className="grid gap-1 py-3 sm:grid-cols-[8rem_1fr] sm:gap-4">
            <dt className="font-medium text-foreground">Repository</dt>
            <dd className="break-all text-subtle">{submission.repoUrl}</dd>
          </div>
          <div className="grid gap-1 py-3 sm:grid-cols-[8rem_1fr] sm:gap-4">
            <dt className="font-medium text-foreground">Live link</dt>
            <dd className="break-all text-subtle">{submission.liveUrl}</dd>
          </div>
          <div className="grid gap-1 py-3 sm:grid-cols-[8rem_1fr] sm:gap-4">
            <dt className="font-medium text-foreground">Description</dt>
            <dd className="whitespace-pre-wrap text-subtle">{submission.description}</dd>
          </div>
        </dl>

        <p className="text-sm text-subtle">
          Each student may submit only once. You can sign out anytime from the header.
        </p>
      </CardContent>
    </Card>
  );
}
