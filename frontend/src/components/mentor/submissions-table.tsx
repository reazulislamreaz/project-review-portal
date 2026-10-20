"use client";

import type { ReactNode } from "react";
import { Alert } from "@/components/feedback/alert";
import { Button } from "@/components/ui/button";
import { formatSubmissionDateCompact, statusLabel } from "@/lib/mentor/format";
import type { MentorSubmissionView, PaginationMeta, ReviewStatus } from "@/lib/api/types";

const COLUMN_COUNT = 7;

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
      className="text-foreground underline-offset-2 hover:underline"
    >
      {children}
    </a>
  );
}

function TableMessageRow({ children }: { children: ReactNode }) {
  return (
    <tr>
      <td colSpan={COLUMN_COUNT} className="h-48 px-4 align-middle">
        {children}
      </td>
    </tr>
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
  const page = pagination?.page ?? 1;
  const totalPages = pagination?.totalPages ?? 0;
  const total = pagination?.total ?? 0;
  const canPrev = page > 1;
  const canNext = totalPages > 0 && page < totalPages;
  const showRows = !error && !(loading && items.length === 0) && items.length > 0;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[64rem] border-collapse text-left text-sm">
          <thead className="bg-muted/50">
            <tr className="border-b border-border">
              <th
                scope="col"
                className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wide text-subtle"
              >
                Project
              </th>
              <th
                scope="col"
                className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wide text-subtle"
              >
                Student
              </th>
              <th
                scope="col"
                className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wide text-subtle"
              >
                Links
              </th>
              <th
                scope="col"
                className="min-w-[12rem] px-4 py-3 text-xs font-medium uppercase tracking-wide text-subtle"
              >
                Description
              </th>
              <th
                scope="col"
                className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wide text-subtle"
              >
                Status
              </th>
              <th
                scope="col"
                className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wide text-subtle"
              >
                Submitted
              </th>
              <th
                scope="col"
                className="w-44 whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wide text-subtle"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {error ? (
              <TableMessageRow>
                <Alert variant="error">{error}</Alert>
              </TableMessageRow>
            ) : null}

            {!error && loading && items.length === 0 ? (
              <TableMessageRow>
                <p className="text-sm text-subtle" role="status" aria-live="polite">
                  Loading submissions...
                </p>
              </TableMessageRow>
            ) : null}

            {!error && !loading && items.length === 0 ? (
              <TableMessageRow>
                <p className="text-sm text-subtle" role="status">
                  No submissions match this filter.
                </p>
              </TableMessageRow>
            ) : null}

            {showRows
              ? items.map((submission) => {
                  const busy = reviewingId === submission.id;
                  const canReview = submission.status === "PENDING";

                  return (
                    <tr
                      key={submission.id}
                      className="border-b border-border last:border-b-0 hover:bg-muted/30"
                    >
                      <td className="max-w-[10rem] px-4 py-3 align-middle font-medium text-foreground">
                        <span className="line-clamp-2 break-words">{submission.projectName}</span>
                      </td>
                      <td className="max-w-[12rem] px-4 py-3 align-middle">
                        <div className="line-clamp-1 font-medium text-foreground">
                          {submission.student.name}
                        </div>
                        <div className="mt-0.5 line-clamp-1 break-all text-xs text-muted-foreground">
                          {submission.student.email}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 align-middle">
                        <div className="flex flex-col gap-1 text-sm">
                          <ExternalLink href={submission.repoUrl}>Repository</ExternalLink>
                          <ExternalLink href={submission.liveUrl}>Live site</ExternalLink>
                        </div>
                      </td>
                      <td className="max-w-[16rem] px-4 py-3 align-middle text-subtle">
                        <p className="line-clamp-2 break-words">{submission.description}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 align-middle">
                        <span className="inline-flex rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground">
                          {statusLabel(submission.status)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 align-middle text-subtle">
                        {formatSubmissionDateCompact(submission.createdAt)}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        {canReview ? (
                          <div className="flex flex-nowrap items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              className="h-8 shrink-0 px-2.5 text-xs"
                              disabled={actionsDisabled}
                              onClick={() => onReview(submission.id, "APPROVED")}
                            >
                              {busy ? "Saving..." : "Approve"}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 shrink-0 px-2.5 text-xs"
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
                })
              : null}
          </tbody>
        </table>
      </div>

      <div className="flex min-h-10 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-subtle" aria-live="polite">
          Page {page} of {Math.max(totalPages, 1)} · {total} total
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
    </div>
  );
}
