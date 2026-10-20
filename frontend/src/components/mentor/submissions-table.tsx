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
  onPageChange: (page: number) => void;
  onReview: (submissionId: string, status: ReviewStatus) => void;
};

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="break-all text-slate-900 underline-offset-2 hover:underline"
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
  onPageChange,
  onReview,
}: SubmissionsTableProps) {
  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  if (loading && items.length === 0) {
    return (
      <p className="text-sm text-slate-600" role="status" aria-live="polite">
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
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                Project
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Student
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Links
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Description
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Status
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Submitted
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((submission) => {
              const busy = reviewingId === submission.id;
              const canReview = submission.status === "PENDING";

              return (
                <tr key={submission.id} className="align-top">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {submission.projectName}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    <div>{submission.student.name}</div>
                    <div className="break-all text-slate-500">{submission.student.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div>
                        <ExternalLink href={submission.repoUrl}>Repository</ExternalLink>
                      </div>
                      <div>
                        <ExternalLink href={submission.liveUrl}>Live site</ExternalLink>
                      </div>
                    </div>
                  </td>
                  <td className="max-w-xs px-4 py-3 text-slate-600">
                    <p className="whitespace-pre-wrap break-words">{submission.description}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800">
                      {statusLabel(submission.status)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {formatSubmissionDate(submission.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    {canReview ? (
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          type="button"
                          size="sm"
                          disabled={busy || reviewingId !== null}
                          onClick={() => onReview(submission.id, "APPROVED")}
                        >
                          {busy ? "Saving..." : "Approve"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy || reviewingId !== null}
                          onClick={() => onReview(submission.id, "REJECTED")}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">Reviewed</span>
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
          <p className="text-sm text-slate-600" aria-live="polite">
            Page {pagination.page} of {Math.max(pagination.totalPages, 1)} · {pagination.total}{" "}
            total
            {loading ? " · Refreshing..." : ""}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canPrev || loading || reviewingId !== null}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canNext || loading || reviewingId !== null}
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
