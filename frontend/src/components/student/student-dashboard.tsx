"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/feedback/alert";
import { CardSkeleton } from "@/components/feedback/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { StatusTimeline } from "@/components/student/status-timeline";
import { SubmissionDetails } from "@/components/student/submission-details";
import { SubmissionForm } from "@/components/student/submission-form";
import { Button } from "@/components/ui/button";
import { getMySubmission } from "@/lib/api/submissions";
import { ApiError, type SafeSubmission } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { formatSubmissionDate, statusLabel } from "@/lib/mentor/format";

function loadErrorMessage(error: ApiError): string {
  switch (error.status) {
    case 401:
      return "Your session has expired. Please log in again.";
    case 403:
      return "You do not have permission to view this dashboard.";
    case 0:
      return error.message;
    default:
      return error.message || "Unable to load your submission. Please try again.";
  }
}

export function StudentDashboard() {
  const router = useRouter();
  const { user, token, logout } = useAuth();

  const [submission, setSubmission] = useState<SafeSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const handleAuthFailure = useCallback(() => {
    logout();
    router.replace("/login");
  }, [logout, router]);

  const refreshSubmission = useCallback(
    async (signal?: AbortSignal) => {
      if (!token) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const next = await getMySubmission(token);
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
          setError("Unable to load your submission. Please try again.");
          setSubmission(null);
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [token, handleAuthFailure],
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    const controller = new AbortController();
    void refreshSubmission(controller.signal);
    return () => controller.abort();
  }, [token, refreshSubmission]);

  function handleSubmitSuccess(created: SafeSubmission) {
    setSubmission(created);
    setJustSubmitted(true);
    setError(null);
  }

  const overviewLabel = loading
    ? "Loading…"
    : error
      ? "Unavailable"
      : submission
        ? statusLabel(submission.status)
        : "Not submitted";

  return (
    <div className="w-full min-w-0 space-y-8">
      <PageHeader
        title={user ? `Welcome, ${user.name}` : "Welcome"}
        description="Track your project submission and review status. Each student may submit only once."
      />

      <section aria-labelledby="overview-heading" className="space-y-3">
        <h2 id="overview-heading" className="text-sm font-medium text-foreground">
          Overview
        </h2>
        <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
          <div className="min-w-0 bg-surface px-4 py-4 sm:px-5">
            <p className="text-xs font-medium text-muted-foreground">Submission status</p>
            <p className="mt-1.5 truncate text-lg font-semibold tracking-tight text-foreground">
              {overviewLabel}
            </p>
          </div>
          <div className="min-w-0 bg-surface px-4 py-4 sm:px-5">
            <p className="text-xs font-medium text-muted-foreground">Last updated</p>
            <p className="mt-1.5 truncate text-lg font-semibold tracking-tight text-foreground">
              {loading || error || !submission
                ? "—"
                : formatSubmissionDate(submission.updatedAt)}
            </p>
          </div>
        </div>
      </section>

      <div className="min-h-[16rem] min-w-0 space-y-6">
        {error ? (
          <div className="space-y-3">
            <Alert variant="error">{error}</Alert>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refreshSubmission()}
            >
              Try again
            </Button>
          </div>
        ) : null}

        {loading ? <CardSkeleton /> : null}

        {!loading && !error && justSubmitted && submission ? (
          <Alert variant="success" title="Submission received">
            Your project was submitted successfully and is now pending mentor review.
          </Alert>
        ) : null}

        {!loading && !error && submission ? (
          <div className="space-y-6">
            <StatusTimeline submission={submission} />
            <SubmissionDetails submission={submission} />
          </div>
        ) : null}

        {!loading && !error && !submission ? (
          <section aria-labelledby="submit-heading" className="space-y-4">
            <div className="space-y-1">
              <h2 id="submit-heading" className="text-sm font-medium text-foreground">
                Submit your project
              </h2>
              <p className="text-sm text-subtle">
                You have not submitted a project yet. Provide your project details below.
              </p>
            </div>
            <SubmissionForm onSuccess={handleSubmitSuccess} />
          </section>
        ) : null}
      </div>
    </div>
  );
}
