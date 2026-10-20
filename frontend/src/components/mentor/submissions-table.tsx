"use client";

import type { ReactNode } from "react";
import { Alert } from "@/components/feedback/alert";
import { Button } from "@/components/ui/button";
import {
  formatSubmissionDateCompact,
  formatWaitingDuration,
  statusLabel,
} from "@/lib/mentor/format";
import type { MentorSubmissionView, PaginationMeta, ReviewStatus } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const COLUMN_COUNT = 7;
/** Fixed row height so pending age text cannot stretch the table. */
const ROW_HEIGHT_CLASS = "h-16";
const ROW_HEIGHT_REM = 4;

type SubmissionsTableProps = {
  items: MentorSubmissionView[];
  pagination: PaginationMeta | null;
  loading: boolean;
  error: string | null;
  reviewingId: string | null;
  /** True while a confirmation dialog is open for a review action. */
  reviewLocked?: boolean;
  /** API page size — used to keep body height stable across filters. */
  pageSize?: number;
  emptyMessage?: string;
  onPageChange: (page: number) => void;
  onReview: (submissionId: string, status: ReviewStatus) => void;
  onRetry?: () => void;
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

function TableMessageRow({
  children,
  pageSize,
}: {
  children: ReactNode;
  pageSize: number;
}) {
  return (
    <tr>
      <td
        colSpan={COLUMN_COUNT}
        className="px-4 align-middle"
        style={{ height: `${pageSize * ROW_HEIGHT_REM}rem` }}
      >
        {children}
      </td>
    </tr>
  );
}

function FillerRows({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }

  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <tr
          key={`filler-${index}`}
          aria-hidden="true"
          className={`${ROW_HEIGHT_CLASS} border-b border-border last:border-b-0`}
        >
          <td colSpan={COLUMN_COUNT} className="p-0">
            &nbsp;
          </td>
        </tr>
      ))}
    </>
  );
}

export function SubmissionsTable({
  items,
  pagination,
  loading,
  error,
  reviewingId,
  reviewLocked = false,
  pageSize = 10,
  emptyMessage = "No submissions match this filter.",
  onPageChange,
  onReview,
  onRetry,
}: SubmissionsTableProps) {
  const actionsDisabled = reviewingId !== null || reviewLocked;
  const page = pagination?.page ?? 1;
  const totalPages = pagination?.totalPages ?? 0;
  const total = pagination?.total ?? 0;
  const canPrev = page > 1;
  const canNext = totalPages > 0 && page < totalPages;
  // Keep previous rows visible while a refresh is in flight (stale-while-revalidate).
  const showRows = !error && items.length > 0;
  const showEmpty = !error && !loading && items.length === 0;
  const showLoadingPlaceholder = !error && loading && items.length === 0;
  const fillerCount = showRows ? Math.max(pageSize - items.length, 0) : 0;

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "overflow-x-auto rounded-lg border border-border bg-surface transition-opacity duration-200 ease-out",
          loading && items.length > 0 ? "opacity-60" : "opacity-100",
        )}
        aria-busy={loading}
      >
        <table className="w-full min-w-[64rem] table-fixed border-collapse text-left text-sm">
          <thead className="bg-muted/50">
            <tr className="border-b border-border">
              <th
                scope="col"
                className="w-[12%] whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wide text-subtle"
              >
                Project
              </th>
              <th
                scope="col"
                className="w-[16%] whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wide text-subtle"
              >
                Student
              </th>
              <th
                scope="col"
                className="w-[10%] whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wide text-subtle"
              >
                Links
              </th>
              <th
                scope="col"
                className="w-[22%] px-4 py-3 text-xs font-medium uppercase tracking-wide text-subtle"
              >
                Description
              </th>
              <th
                scope="col"
                className="w-[10%] whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wide text-subtle"
              >
                Status
              </th>
              <th
                scope="col"
                className="w-[14%] whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wide text-subtle"
              >
                Submitted
              </th>
              <th
                scope="col"
                className="w-[16%] whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wide text-subtle"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {error ? (
              <TableMessageRow pageSize={pageSize}>
                <div className="space-y-3">
                  <Alert variant="error">{error}</Alert>
                  {onRetry ? (
                    <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                      Try again
                    </Button>
                  ) : null}
                </div>
              </TableMessageRow>
            ) : null}

            {showLoadingPlaceholder ? (
              <TableMessageRow pageSize={pageSize}>
                <p className="text-sm text-subtle" role="status" aria-live="polite">
                  Loading submissions...
                </p>
              </TableMessageRow>
            ) : null}

            {showEmpty ? (
              <TableMessageRow pageSize={pageSize}>
                <p className="text-sm text-subtle" role="status">
                  {emptyMessage}
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
                      className={`${ROW_HEIGHT_CLASS} border-b border-border last:border-b-0 hover:bg-muted/30`}
                    >
                      <td className="overflow-hidden px-4 py-2 align-middle font-medium text-foreground">
                        <span className="line-clamp-2 break-words">{submission.projectName}</span>
                      </td>
                      <td className="overflow-hidden px-4 py-2 align-middle">
                        <div className="line-clamp-1 font-medium text-foreground">
                          {submission.student.name}
                        </div>
                        <div className="mt-0.5 line-clamp-1 break-all text-xs text-muted-foreground">
                          {submission.student.email}
                        </div>
                      </td>
                      <td className="overflow-hidden px-4 py-2 align-middle">
                        <div className="flex flex-col gap-0.5 text-sm">
                          <ExternalLink href={submission.repoUrl}>Repository</ExternalLink>
                          <ExternalLink href={submission.liveUrl}>Live site</ExternalLink>
                        </div>
                      </td>
                      <td className="overflow-hidden px-4 py-2 align-middle text-subtle">
                        <p className="line-clamp-2 break-words">{submission.description}</p>
                      </td>
                      <td className="overflow-hidden px-4 py-2 align-middle">
                        <span className="inline-flex rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground">
                          {statusLabel(submission.status)}
                        </span>
                      </td>
                      <td className="overflow-hidden px-4 py-2 align-middle text-subtle">
                        <div className="line-clamp-1">{formatSubmissionDateCompact(submission.createdAt)}</div>
                        {canReview ? (
                          <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                            {formatWaitingDuration(submission.createdAt)}
                          </div>
                        ) : (
                          <div className="mt-0.5 h-4" aria-hidden="true" />
                        )}
                      </td>
                      <td className="overflow-hidden px-4 py-2 align-middle">
                        {canReview ? (
                          <div className="flex flex-nowrap items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              className="h-8 shrink-0 px-2.5 text-xs"
                              disabled={actionsDisabled || loading}
                              onClick={() => onReview(submission.id, "APPROVED")}
                            >
                              {busy ? "Saving..." : "Approve"}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 shrink-0 px-2.5 text-xs"
                              disabled={actionsDisabled || loading}
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

            <FillerRows count={fillerCount} />
          </tbody>
        </table>
      </div>

      <div className="flex min-h-10 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-h-5 text-sm text-subtle" aria-live="polite">
          Page {page} of {Math.max(totalPages, 1)} · {total} total
          {loading ? " · Updating…" : ""}
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
