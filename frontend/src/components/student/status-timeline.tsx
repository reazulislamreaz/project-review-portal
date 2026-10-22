"use client";

import type { SafeSubmission } from "@/lib/api/types";
import { formatSubmissionDate } from "@/lib/mentor/format";
import { cn } from "@/lib/utils";

type TimelineStep = {
  id: string;
  title: string;
  description: string;
  timestamp: string | null;
  state: "complete" | "current" | "upcoming";
};

function buildSteps(submission: SafeSubmission): TimelineStep[] {
  const submitted: TimelineStep = {
    id: "submitted",
    title: submission.resubmittedAt ? "Project resubmitted" : "Project submitted",
    description: submission.resubmittedAt
      ? "Updated project details were sent for another review."
      : "Your project details were received.",
    timestamp: submission.resubmittedAt ?? submission.createdAt,
    state: "complete",
  };

  if (submission.status === "PENDING") {
    return [
      submitted,
      {
        id: "pending",
        title: "Pending review",
        description: "Waiting for a mentor to review your submission. Editing is locked.",
        timestamp: null,
        state: "current",
      },
      {
        id: "decision",
        title: "Review decision",
        description: "Approved or rejected status will appear here.",
        timestamp: null,
        state: "upcoming",
      },
    ];
  }

  if (submission.status === "REJECTED") {
    return [
      submitted,
      {
        id: "pending",
        title: "Pending review",
        description: "Your submission was reviewed by a mentor.",
        timestamp: null,
        state: "complete",
      },
      {
        id: "decision",
        title: "Project rejected",
        description: "Update your project and resubmit for another review.",
        timestamp: submission.reviewedAt,
        state: "current",
      },
    ];
  }

  return [
    submitted,
    {
      id: "pending",
      title: "Pending review",
      description: "Your submission was in the review queue.",
      timestamp: null,
      state: "complete",
    },
    {
      id: "decision",
      title: "Project approved",
      description: "A mentor approved your project. This submission is final and locked.",
      timestamp: submission.reviewedAt,
      state: "complete",
    },
  ];
}

type StatusTimelineProps = {
  submission: SafeSubmission;
};

export function StatusTimeline({ submission }: StatusTimelineProps) {
  const steps = buildSteps(submission);

  return (
    <section aria-labelledby="timeline-heading" className="space-y-3">
      <h2 id="timeline-heading" className="text-sm font-medium text-foreground">
        Status timeline
      </h2>
      <ol className="space-y-0 rounded-lg border border-border bg-surface px-4 py-2 sm:px-5">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          return (
            <li key={step.id} className="relative flex gap-3 py-3">
              {!isLast ? (
                <span
                  className="absolute left-[0.6875rem] top-8 h-[calc(100%-0.5rem)] w-px bg-border"
                  aria-hidden
                />
              ) : null}
              <span
                className={cn(
                  "relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[0.65rem] font-semibold",
                  step.state === "complete" &&
                    "border-foreground bg-foreground text-primary-foreground",
                  step.state === "current" &&
                    "border-foreground bg-surface text-foreground",
                  step.state === "upcoming" &&
                    "border-border bg-muted text-muted-foreground",
                )}
                aria-hidden
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p
                  className={cn(
                    "text-sm font-medium",
                    step.state === "upcoming" ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  {step.title}
                </p>
                <p className="text-sm text-subtle">{step.description}</p>
                {step.timestamp ? (
                  <p className="text-xs text-muted-foreground">
                    {formatSubmissionDate(step.timestamp)}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
