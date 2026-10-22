"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Alert } from "@/components/feedback/alert";
import { CardSkeleton } from "@/components/feedback/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getSubmissionForMentor,
  updateSubmissionStatus,
} from "@/lib/api/submissions";
import { ApiError, type MentorSubmissionView, type ReviewStatus } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import {
  formatSubmissionDate,
  formatWaitingDuration,
  statusLabel,
} from "@/lib/mentor/format";

const MAX_FEEDBACK_LENGTH = 2000;

type SubmissionDetailProps = {
  submissionId: string;
};

function loadErrorMessage(error: ApiError): string {
  switch (error.status) {
    case 401:
      return "Your session has expired. Please log in again.";
    case 403:
      return "You do not have permission to view this submission.";
    case 404:
      return "That submission could not be found.";
    case 0:
      return error.message;
    default:
      return error.message || "Unable to load this submission.";
  }
}

function reviewErrorMessage(error: ApiError): string {
  switch (error.status) {
    case 401:
      return "Your session has expired. Please log in again.";
    case 403:
      return "You do not have permission to review submissions.";
    case 404:
      return error.message || "That submission could not be found.";
    case 409:
      return (
        error.message ||
        "This submission has already been reviewed and cannot be changed."
      );
    case 0:
      return error.message;
    default:
      return error.message || "Unable to update the submission. Please try again.";
  }
}

export function SubmissionDetail({ submissionId }: SubmissionDetailProps) {
  const router = useRouter();
  const { token, logout } = useAuth();

  const [submission, setSubmission] = useState<MentorSubmissionView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<ReviewStatus | null>(null);
  const [feedbackDraft, setFeedbackDraft] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const handleAuthFailure = useCallback(() => {
    logout();
    router.replace("/login");
  }, [logout, router]);

  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      if (!token) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const next = await getSubmissionForMentor(submissionId, token);
        if (signal?.aborted) {
          return;
        }
        setSubmission(next);
      } catch (err) {
        if (signal?.aborted) {
          return;
        }
        if (err instanceof ApiError) {
          if (err.status === 401) {
            handleAuthFailure();
            return;
          }
          setError(loadErrorMessage(err));
          setSubmission(null);
        } else {
          setError("Unable to load this submission.");
          setSubmission(null);
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [token, submissionId, handleAuthFailure],
  );

  useEffect(() => {
    if (!token) {
      return;
    }
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [token, refresh]);

  function openReview(status: ReviewStatus) {
    setActionMessage(null);
    setActionError(null);
    setFeedbackDraft("");
    setPendingStatus(status);
  }

  async function confirmReview() {
    if (!token || !submission || !pendingStatus || reviewing) {
      return;
    }

    if (feedbackDraft.length > MAX_FEEDBACK_LENGTH) {
      setActionError(`Feedback must be at most ${MAX_FEEDBACK_LENGTH} characters.`);
      return;
    }

    setReviewing(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const updated = await updateSubmissionStatus(
        submission.id,
        pendingStatus,
        token,
        feedbackDraft,
      );
      setSubmission(updated);
      setPendingStatus(null);
      setFeedbackDraft("");
      setActionMessage(
        pendingStatus === "APPROVED"
          ? `“${updated.projectName}” was approved.`
          : `“${updated.projectName}” was rejected.`,
      );
    } catch (err) {
      setPendingStatus(null);
      setFeedbackDraft("");
      if (err instanceof ApiError) {
        if (err.status === 401) {
          handleAuthFailure();
          return;
        }
        setActionError(reviewErrorMessage(err));
        if (err.status === 404 || err.status === 409) {
          await refresh();
        }
      } else {
        setActionError("Unable to update the submission. Please try again.");
      }
    } finally {
      setReviewing(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Submission detail" />
        <CardSkeleton />
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="space-y-6">
        <PageHeader title="Submission detail" />
        <Alert variant="error">{error ?? "Submission not found."}</Alert>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void refresh()}>
            Try again
          </Button>
          <Link
            href="/mentor"
            className="inline-flex h-9 items-center rounded-md border border-border-strong bg-surface px-3 text-sm font-medium text-foreground hover:bg-muted"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const canReview = submission.status === "PENDING";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title={submission.projectName}
          description="Full project details for mentor review."
        />
        <Link
          href="/mentor"
          className="inline-flex h-9 shrink-0 items-center gap-2 self-start rounded-md border border-border-strong bg-surface px-3 text-sm font-medium text-foreground hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to dashboard
        </Link>
      </div>

      {actionMessage ? <Alert variant="success">{actionMessage}</Alert> : null}
      {actionError ? <Alert variant="error">{actionError}</Alert> : null}

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <CardTitle as="h2">Project overview</CardTitle>
          <span className="inline-flex w-fit rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
            {statusLabel(submission.status)}
          </span>
        </CardHeader>
        <CardContent className="space-y-5">
          {submission.status === "PENDING" ? (
            <Alert variant="info" title="Awaiting your review">
              This submission is pending. Review the details below, then approve or reject.
              Waiting {formatWaitingDuration(submission.createdAt)}.
            </Alert>
          ) : null}

          {submission.feedback ? (
            <Alert
              variant={submission.status === "REJECTED" ? "error" : "info"}
              title="Mentor feedback"
            >
              {submission.feedback}
            </Alert>
          ) : null}

          {submission.previousFeedback ? (
            <Alert variant="info" title="Previous rejection feedback">
              {submission.previousFeedback}
            </Alert>
          ) : null}

          <dl className="divide-y divide-border border-t border-border text-sm">
            <div className="grid gap-1 py-3 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
              <dt className="font-medium text-foreground">Student</dt>
              <dd className="min-w-0 text-subtle">
                <div>{submission.student.name}</div>
                <div className="break-all text-muted-foreground">{submission.student.email}</div>
              </dd>
            </div>
            <div className="grid gap-1 py-3 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
              <dt className="font-medium text-foreground">Project name</dt>
              <dd className="min-w-0 break-words text-subtle">{submission.projectName}</dd>
            </div>
            <div className="grid gap-1 py-3 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
              <dt className="font-medium text-foreground">Repository</dt>
              <dd className="min-w-0 break-all">
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
            <div className="grid gap-1 py-3 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
              <dt className="font-medium text-foreground">Live link</dt>
              <dd className="min-w-0 break-all">
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
            <div className="grid gap-1 py-3 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
              <dt className="font-medium text-foreground">Description</dt>
              <dd className="min-w-0 whitespace-pre-wrap text-subtle">{submission.description}</dd>
            </div>
            <div className="grid gap-1 py-3 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
              <dt className="font-medium text-foreground">Submitted</dt>
              <dd className="text-subtle">{formatSubmissionDate(submission.createdAt)}</dd>
            </div>
            {submission.resubmittedAt ? (
              <div className="grid gap-1 py-3 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
                <dt className="font-medium text-foreground">Resubmitted</dt>
                <dd className="text-subtle">{formatSubmissionDate(submission.resubmittedAt)}</dd>
              </div>
            ) : null}
            {submission.reviewedAt ? (
              <div className="grid gap-1 py-3 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
                <dt className="font-medium text-foreground">Reviewed</dt>
                <dd className="text-subtle">{formatSubmissionDate(submission.reviewedAt)}</dd>
              </div>
            ) : null}
            <div className="grid gap-1 py-3 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
              <dt className="font-medium text-foreground">Last updated</dt>
              <dd className="text-subtle">{formatSubmissionDate(submission.updatedAt)}</dd>
            </div>
          </dl>

          {canReview ? (
            <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={reviewing || pendingStatus !== null}
                onClick={() => openReview("REJECTED")}
              >
                Reject
              </Button>
              <Button
                type="button"
                disabled={reviewing || pendingStatus !== null}
                onClick={() => openReview("APPROVED")}
              >
                Approve
              </Button>
            </div>
          ) : (
            <p className="border-t border-border pt-5 text-sm text-muted-foreground">
              This submission has already been reviewed and is locked for status changes.
            </p>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={pendingStatus !== null}
        title={pendingStatus === "APPROVED" ? "Approve submission?" : "Reject submission?"}
        description={
          pendingStatus
            ? `Are you sure you want to ${
                pendingStatus === "APPROVED" ? "approve" : "reject"
              } “${submission.projectName}”? This decision cannot be undone.`
            : ""
        }
        confirmLabel={pendingStatus === "APPROVED" ? "Approve" : "Reject"}
        cancelLabel="Cancel"
        busy={reviewing}
        onConfirm={() => {
          void confirmReview();
        }}
        onCancel={() => {
          if (!reviewing) {
            setPendingStatus(null);
            setFeedbackDraft("");
          }
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="detail-review-feedback">Feedback (optional)</Label>
          <Textarea
            id="detail-review-feedback"
            value={feedbackDraft}
            onChange={(event) => setFeedbackDraft(event.target.value)}
            placeholder="Share brief notes for the student"
            disabled={reviewing}
            maxLength={MAX_FEEDBACK_LENGTH}
            className="min-h-24"
          />
          <p className="text-xs text-muted-foreground">
            {feedbackDraft.length}/{MAX_FEEDBACK_LENGTH}
          </p>
        </div>
      </ConfirmDialog>
    </div>
  );
}
