"use client";

import type { ReactNode } from "react";
import { Alert } from "@/components/feedback/alert";
import { Button } from "@/components/ui/button";
import { formatSubmissionDate, statusLabel } from "@/lib/mentor/format";
import type { MentorSubmissionView, PaginationMeta, ReviewStatus } from "@/lib/api/types";

type SubmissionsTableProps = {
  items: MentorSubmissionView[];
  pagination: PaginationMeta | null;
  loading: boolean;
  error: string | null;
  reviewingId: string | null;
  /** True while a confirmation dialog is open for a review action. */
  reviewLocked?: boolean;
  onPageChange: (page: number) => void;
  onReview: (submissionId: string, status: ReviewStatus) => void;
};

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="break-all text-foreground underline-offset-2 hover:underline"
    >
      {children}
    </a>
  );
}

export function SubmissionsTable({
  items,
  pagination,
  loading,
  error,
  reviewingId,
  reviewLocked = false,
  onPageChange,
  onReview,
}: SubmissionsTableProps) {
  const actionsDisabled = reviewingId !== null || reviewLocked;
  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  if (loading && items.length === 0) {
    return (
      <p className="text-sm text-subtle" role="status" aria-live="polite">
        Loading submissions...
      </p>
    );
  }

  if (!loading && items.length === 0) {
    return <Alert variant="info">No submissions match this filter.</Alert>;
  }

  const page = pagination?.page ?? 1;
  const totalPages = pagination?.totalPages ?? 0;
  const canPrev = page > 1;
  const canNext = totalPages > 0 && page < totalPages;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="px-4 py-3 text-xs font-medium text-muted-foreground">
                Project
              </th>
              <th scope="col" className="px-4 py-3 text-xs font-medium text-muted-foreground">
                Student
              </th>
              <th scope="col" className="px-4 py-3 text-xs font-medium text-muted-foreground">
                Links
              </th>
              <th scope="col" className="px-4 py-3 text-xs font-medium text-muted-foreground">
                Description
              </th>
              <th scope="col" className="px-4 py-3 text-xs font-medium text-muted-foreground">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-xs font-medium text-muted-foreground">
                Submitted
              </th>
              <th scope="col" className="px-4 py-3 text-xs font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((submission) => {
              const busy = reviewingId === submission.id;
              const canReview = submission.status === "PENDING";

              return (
                <tr key={submission.id} className="align-top border-b border-border last:border-b-0">
                  <td className="px-4 py-3.5 font-medium text-foreground">
                    {submission.projectName}
                  </td>
                  <td className="px-4 py-3.5 text-subtle">
                    <div className="text-foreground">{submission.student.name}</div>
                    <div className="mt-0.5 break-all text-muted-foreground">
                      {submission.student.email}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="space-y-1">
                      <div>
                        <ExternalLink href={submission.repoUrl}>Repository</ExternalLink>
                      </div>
                      <div>
                        <ExternalLink href={submission.liveUrl}>Live site</ExternalLink>
                      </div>
                    </div>
                  </td>
                  <td className="max-w-xs px-4 py-3.5 text-subtle">
                    <p className="whitespace-pre-wrap break-words">{submission.description}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground">
                      {statusLabel(submission.status)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-subtle">
                    {formatSubmissionDate(submission.createdAt)}
                  </td>
                  <td className="px-4 py-3.5">
                    {canReview ? (
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          type="button"
                          size="sm"
                          disabled={actionsDisabled}
                          onClick={() => onReview(submission.id, "APPROVED")}
                        >
                          {busy ? "Saving..." : "Approve"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={actionsDisabled}
                          onClick={() => onReview(submission.id, "REJECTED")}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Reviewed</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-subtle" aria-live="polite">
            Page {pagination.page} of {Math.max(pagination.totalPages, 1)} · {pagination.total}{" "}
            total
            {loading ? " · Refreshing..." : ""}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canPrev || loading || actionsDisabled}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canNext || loading || actionsDisabled}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
