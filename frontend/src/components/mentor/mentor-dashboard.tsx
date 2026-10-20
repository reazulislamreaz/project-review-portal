"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/feedback/alert";
import { PageHeader } from "@/components/layout/page-header";
import { StatsPanel } from "@/components/mentor/stats-panel";
import { StatusFilterControl } from "@/components/mentor/status-filter";
import { SubmissionsTable } from "@/components/mentor/submissions-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getDashboardStats } from "@/lib/api/dashboard";
import {
  listSubmissionsForMentor,
  updateSubmissionStatus,
} from "@/lib/api/submissions";
import {
  ApiError,
  type DashboardStats,
  type MentorSubmissionView,
  type PaginationMeta,
  type ReviewStatus,
  type StatusFilter,
} from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";

const PAGE_LIMIT = 10;

type PendingReview = {
  submissionId: string;
  projectName: string;
  status: ReviewStatus;
};

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

function loadErrorMessage(error: ApiError, kind: "stats" | "list"): string {
  if (error.status === 401) {
    return "Your session has expired. Please log in again.";
  }
  if (error.status === 403) {
    return "You do not have permission to view mentor data.";
  }
  if (error.status === 0) {
    return error.message;
  }
  return kind === "stats"
    ? error.message || "Unable to load dashboard statistics."
    : error.message || "Unable to load submissions.";
}

export function MentorDashboard() {
  const router = useRouter();
  const { token, logout } = useAuth();

  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<MentorSubmissionView[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const [listLoading, setListLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [pendingReview, setPendingReview] = useState<PendingReview | null>(null);

  const handleAuthFailure = useCallback(() => {
    logout();
    router.replace("/login");
  }, [logout, router]);

  const refreshStats = useCallback(
    async (signal?: AbortSignal) => {
      if (!token) {
        return;
      }

      setStatsLoading(true);
      setStatsError(null);

      try {
        const nextStats = await getDashboardStats(token);
        if (signal?.aborted) {
          return;
        }
        setStats(nextStats);
      } catch (error) {
        if (signal?.aborted) {
          return;
        }
        if (error instanceof ApiError) {
          if (error.status === 401) {
            handleAuthFailure();
            return;
          }
          setStatsError(loadErrorMessage(error, "stats"));
        } else {
          setStatsError("Unable to load dashboard statistics.");
        }
      } finally {
        if (!signal?.aborted) {
          setStatsLoading(false);
        }
      }
    },
    [token, handleAuthFailure],
  );

  const refreshList = useCallback(
    async (nextPage: number, nextFilter: StatusFilter, signal?: AbortSignal) => {
      if (!token) {
        return;
      }

      setListLoading(true);
      setListError(null);

      try {
        const result = await listSubmissionsForMentor(token, {
          page: nextPage,
          limit: PAGE_LIMIT,
          status: nextFilter === "ALL" ? undefined : nextFilter,
        });

        if (signal?.aborted) {
          return;
        }

        setItems(result.items);
        setPagination(result.pagination);

        // If the current page is empty after a review but earlier pages exist, step back.
        if (
          result.items.length === 0 &&
          result.pagination.page > 1 &&
          result.pagination.totalPages > 0 &&
          result.pagination.page > result.pagination.totalPages
        ) {
          setPage(result.pagination.totalPages);
        }
      } catch (error) {
        if (signal?.aborted) {
          return;
        }
        if (error instanceof ApiError) {
          if (error.status === 401) {
            handleAuthFailure();
            return;
          }
          setListError(loadErrorMessage(error, "list"));
        } else {
          setListError("Unable to load submissions.");
        }
      } finally {
        if (!signal?.aborted) {
          setListLoading(false);
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
    void refreshStats(controller.signal);
    return () => controller.abort();
  }, [token, refreshStats]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const controller = new AbortController();
    void refreshList(page, filter, controller.signal);
    return () => controller.abort();
  }, [token, page, filter, refreshList]);

  function handleFilterChange(nextFilter: StatusFilter) {
    setActionMessage(null);
    setActionError(null);
    setItems([]);
    setPagination(null);
    setListError(null);
    setFilter(nextFilter);
    setPage(1);
  }

  function handlePageChange(nextPage: number) {
    setActionMessage(null);
    setActionError(null);
    setItems([]);
    setPagination(null);
    setListError(null);
    setPage(nextPage);
  }

  function handleReviewRequest(submissionId: string, status: ReviewStatus) {
    if (!token || reviewingId || pendingReview) {
      return;
    }

    const submission = items.find((item) => item.id === submissionId);
    setActionMessage(null);
    setActionError(null);
    setPendingReview({
      submissionId,
      projectName: submission?.projectName ?? "this submission",
      status,
    });
  }

  function handleReviewCancel() {
    if (reviewingId) {
      return;
    }
    setPendingReview(null);
  }

  async function handleReviewConfirm() {
    if (!token || !pendingReview || reviewingId) {
      return;
    }

    const { submissionId, status } = pendingReview;
    setActionMessage(null);
    setActionError(null);
    setReviewingId(submissionId);

    try {
      const updated = await updateSubmissionStatus(submissionId, status, token);
      setPendingReview(null);
      setActionMessage(
        status === "APPROVED"
          ? `“${updated.projectName}” was approved.`
          : `“${updated.projectName}” was rejected.`,
      );
      await Promise.all([refreshList(page, filter), refreshStats()]);
    } catch (error) {
      setPendingReview(null);
      if (error instanceof ApiError) {
        if (error.status === 401) {
          handleAuthFailure();
          return;
        }
        setActionError(reviewErrorMessage(error));
        if (error.status === 404 || error.status === 409) {
          await Promise.all([refreshList(page, filter), refreshStats()]);
        }
      } else {
        setActionError("Unable to update the submission. Please try again.");
      }
    } finally {
      setReviewingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Review dashboard"
        description="Filter and review student project submissions. Statistics reflect the full database, not only the current page."
      />

      <StatsPanel stats={stats} loading={statsLoading} error={statsError} />

      <div className="space-y-4">
        <StatusFilterControl
          value={filter}
          onChange={handleFilterChange}
          disabled={reviewingId !== null || pendingReview !== null}
        />

        {actionMessage ? <Alert variant="success">{actionMessage}</Alert> : null}
        {actionError ? <Alert variant="error">{actionError}</Alert> : null}

        <SubmissionsTable
          items={items}
          pagination={pagination}
          loading={listLoading}
          error={listError}
          reviewingId={reviewingId}
          reviewLocked={pendingReview !== null}
          pageSize={PAGE_LIMIT}
          onPageChange={handlePageChange}
          onReview={handleReviewRequest}
        />
      </div>

      <ConfirmDialog
        open={pendingReview !== null}
        title={
          pendingReview?.status === "APPROVED"
            ? "Approve submission?"
            : "Reject submission?"
        }
        description={
          pendingReview
            ? `Are you sure you want to ${
                pendingReview.status === "APPROVED" ? "approve" : "reject"
              } “${pendingReview.projectName}”? This decision cannot be undone.`
            : ""
        }
        confirmLabel={pendingReview?.status === "APPROVED" ? "Approve" : "Reject"}
        cancelLabel="Cancel"
        busy={reviewingId !== null}
        onConfirm={() => {
          void handleReviewConfirm();
        }}
        onCancel={handleReviewCancel}
      />
    </div>
  );
}
