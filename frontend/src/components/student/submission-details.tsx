"use client";

import { Alert } from "@/components/feedback/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SafeSubmission } from "@/lib/api/types";
import {
  formatSubmissionDate,
  formatWaitingDuration,
  statusLabel,
} from "@/lib/mentor/format";

type SubmissionDetailsProps = {
  submission: SafeSubmission;
};

function statusMessage(submission: SafeSubmission): string {
  switch (submission.status) {
    case "PENDING":
      return submission.resubmittedAt
        ? "Your updated project was resubmitted and is awaiting mentor review. Editing is locked until a decision is made."
        : "Your submission is awaiting mentor review. You cannot edit or resubmit while it is pending.";
    case "APPROVED":
      return "Your project has been approved. This decision is final — the submission is locked and cannot be edited or resubmitted.";
    case "REJECTED":
      return "Your project was rejected. Review the mentor feedback below, update your details, and resubmit for another review.";
    default:
      return `Current status is ${submission.status}.`;
  }
}

export function SubmissionDetails({ submission }: SubmissionDetailsProps) {
  const alertVariant =
    submission.status === "APPROVED"
      ? "success"
      : submission.status === "REJECTED"
        ? "error"
        : "info";

  const rejectionFeedback =
    submission.status === "REJECTED"
      ? submission.feedback
      : submission.previousFeedback;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle>My project submission</CardTitle>
            <CardDescription>
              Submitted {formatSubmissionDate(submission.createdAt)}
              {submission.resubmittedAt
                ? ` · Last resubmitted ${formatSubmissionDate(submission.resubmittedAt)}`
                : null}
              .
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
          {statusMessage(submission)}
        </Alert>

        {submission.status === "REJECTED" && submission.feedback ? (
          <Alert variant="error" title="Mentor feedback — please address before resubmitting">
            {submission.feedback}
          </Alert>
        ) : null}

        {submission.status === "PENDING" && rejectionFeedback ? (
          <Alert variant="info" title="Previous mentor feedback">
            {rejectionFeedback}
          </Alert>
        ) : null}

        {submission.status === "APPROVED" && submission.feedback ? (
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
            <dd className="text-subtle">
              <div>{formatSubmissionDate(submission.createdAt)}</div>
              {submission.status === "PENDING" ? (
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {formatWaitingDuration(submission.resubmittedAt ?? submission.createdAt)}
                </div>
              ) : null}
            </dd>
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
