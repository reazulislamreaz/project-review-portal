"use client";

import { Alert } from "@/components/feedback/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SafeSubmission } from "@/lib/api/types";
import { formatSubmissionDate, statusLabel } from "@/lib/mentor/format";

type SubmissionDetailsProps = {
  submission: SafeSubmission;
};

function statusMessage(status: SafeSubmission["status"]): string {
  switch (status) {
    case "PENDING":
      return "Your submission is awaiting mentor review.";
    case "APPROVED":
      return "Your project has been approved.";
    case "REJECTED":
      return "Your project was rejected.";
    default:
      return `Current status is ${status}.`;
  }
}

export function SubmissionDetails({ submission }: SubmissionDetailsProps) {
  const alertVariant =
    submission.status === "APPROVED"
      ? "success"
      : submission.status === "REJECTED"
        ? "error"
        : "info";

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle>My project submission</CardTitle>
            <CardDescription>
              Submitted {formatSubmissionDate(submission.createdAt)}. Each student may submit only
              once.
            </CardDescription>
          </div>
          <span
            className="inline-flex w-fit rounded-md bg-muted px-2.5 py-1 text-xs font-medium tracking-wide text-foreground"
            aria-label={`Status: ${statusLabel(submission.status)}`}
          >
            {submission.status}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <Alert variant={alertVariant} title={`Status: ${statusLabel(submission.status)}`}>
          {statusMessage(submission.status)}
        </Alert>

        {submission.feedback ? (
          <Alert variant="info" title="Mentor feedback">
            {submission.feedback}
          </Alert>
        ) : null}

        <dl className="divide-y divide-border border-t border-border text-sm">
          <div className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
            <dt className="font-medium text-foreground">Project name</dt>
            <dd className="text-subtle">{submission.projectName}</dd>
          </div>
          <div className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
            <dt className="font-medium text-foreground">Repository</dt>
            <dd className="break-all">
              <a
                href={submission.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline-offset-2 hover:underline"
              >
                {submission.repoUrl}
              </a>
            </dd>
          </div>
          <div className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
            <dt className="font-medium text-foreground">Live link</dt>
            <dd className="break-all">
              <a
                href={submission.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline-offset-2 hover:underline"
              >
                {submission.liveUrl}
              </a>
            </dd>
          </div>
          <div className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
            <dt className="font-medium text-foreground">Description</dt>
            <dd className="whitespace-pre-wrap text-subtle">{submission.description}</dd>
          </div>
          <div className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
            <dt className="font-medium text-foreground">Submitted</dt>
            <dd className="text-subtle">{formatSubmissionDate(submission.createdAt)}</dd>
          </div>
          {submission.reviewedAt ? (
            <div className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
              <dt className="font-medium text-foreground">Reviewed</dt>
              <dd className="text-subtle">{formatSubmissionDate(submission.reviewedAt)}</dd>
            </div>
          ) : null}
        </dl>
      </CardContent>
    </Card>
  );
}
