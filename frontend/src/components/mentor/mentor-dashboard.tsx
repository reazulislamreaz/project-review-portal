"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/feedback/alert";
import { StatsSkeleton } from "@/components/feedback/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { StatsPanel } from "@/components/mentor/stats-panel";
import { StatusFilterControl } from "@/components/mentor/status-filter";
import { SubmissionsTable } from "@/components/mentor/submissions-table";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  type SortOrder,
  type StatusFilter,
} from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";

const PAGE_LIMIT = 10;
const MAX_FEEDBACK_LENGTH = 2000;
/** Short pause so typing does not thrash layout with aborted requests. */
const SEARCH_DEBOUNCE_MS = 200;

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
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
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
  const [feedbackDraft, setFeedbackDraft] = useState("");

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
    async (
      nextPage: number,
      nextFilter: StatusFilter,
      nextQuery: string,
      nextSort: SortOrder,
      signal?: AbortSignal,
    ) => {
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
          q: nextQuery || undefined,
          sortBy: "createdAt",
          sortOrder: nextSort,
        });

        if (signal?.aborted) {
          return;
        }

        setItems(result.items);
        setPagination(result.pagination);

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
    void refreshList(page, filter, searchQuery, sortOrder, controller.signal);
    return () => controller.abort();
  }, [token, page, filter, searchQuery, sortOrder, refreshList]);

  // Debounced search keeps previous rows mounted while the query settles.
  useEffect(() => {
    const trimmed = searchInput.trim();
    const timer = window.setTimeout(() => {
      if (trimmed === searchQuery) {
        return;
      }
      setSearchQuery(trimmed);
      setPage(1);
      setActionMessage(null);
      setActionError(null);
      setListError(null);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [searchInput, searchQuery]);

  function clearActionFeedback() {
    setActionMessage(null);
    setActionError(null);
  }

  function handleFilterChange(nextFilter: StatusFilter) {
    if (nextFilter === filter) {
      return;
    }
    clearActionFeedback();
    setListError(null);
    // Needs-review queue defaults to oldest-first; other views keep newest-first.
    // Keep previous rows visible until the new request resolves (no empty flash).
    if (nextFilter === "PENDING") {
      setSortOrder("asc");
    } else if (filter === "PENDING") {
      setSortOrder("desc");
    }
    setFilter(nextFilter);
    setPage(1);
  }

  function handlePageChange(nextPage: number) {
    if (nextPage === page) {
      return;
    }
    clearActionFeedback();
    setListError(null);
    setPage(nextPage);
  }

  function handleSortChange(nextSort: SortOrder) {
    if (nextSort === sortOrder) {
      return;
    }
    clearActionFeedback();
    setListError(null);
    setSortOrder(nextSort);
    setPage(1);
  }

  function handleReviewRequest(submissionId: string, status: ReviewStatus) {
    if (!token || reviewingId || pendingReview) {
      return;
    }

    const submission = items.find((item) => item.id === submissionId);
    setActionMessage(null);
    setActionError(null);
    setFeedbackDraft("");
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
    setFeedbackDraft("");
  }

  async function handleReviewConfirm() {
    if (!token || !pendingReview || reviewingId) {
      return;
    }

    if (feedbackDraft.length > MAX_FEEDBACK_LENGTH) {
      setActionError(`Feedback must be at most ${MAX_FEEDBACK_LENGTH} characters.`);
      return;
    }

    const { submissionId, status } = pendingReview;
    setActionMessage(null);
    setActionError(null);
    setReviewingId(submissionId);

    try {
      const updated = await updateSubmissionStatus(
        submissionId,
        status,
        token,
        feedbackDraft,
      );
      setPendingReview(null);
      setFeedbackDraft("");
      setActionMessage(
        status === "APPROVED"
          ? `“${updated.projectName}” was approved.`
          : `“${updated.projectName}” was rejected.`,
      );
      await Promise.all([
        refreshList(page, filter, searchQuery, sortOrder),
        refreshStats(),
      ]);
    } catch (error) {
      setPendingReview(null);
      setFeedbackDraft("");
      if (error instanceof ApiError) {
        if (error.status === 401) {
          handleAuthFailure();
          return;
        }
        setActionError(reviewErrorMessage(error));
        if (error.status === 404 || error.status === 409) {
          await Promise.all([
            refreshList(page, filter, searchQuery, sortOrder),
            refreshStats(),
          ]);
        }
      } else {
        setActionError("Unable to update the submission. Please try again.");
      }
    } finally {
      setReviewingId(null);
    }
  }

  const controlsLocked = reviewingId !== null || pendingReview !== null;

  return (
    <div className="space-y-8">
      <PageHeader title="Review dashboard" />

      <div className="min-h-[7.5rem]">
        {statsLoading && !stats ? (
          <StatsSkeleton />
        ) : (
          <div className="space-y-3">
            <StatsPanel stats={stats} loading={statsLoading} error={statsError} />
            {statsError ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void refreshStats()}
              >
                Retry statistics
              </Button>
            ) : null}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <StatusFilterControl
            value={filter}
            onChange={handleFilterChange}
            disabled={controlsLocked}
            pendingCount={stats?.totalPending ?? null}
          />

          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-[minmax(0,20rem)_11rem] sm:items-end lg:w-auto">
            <div className="space-y-2">
              <Label htmlFor="mentor-search">Search</Label>
              <Input
                id="mentor-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Project, student, or email"
                disabled={controlsLocked}
                autoComplete="off"
                aria-label="Search by project, student, or email. Results update as you type."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mentor-sort">Sort by date</Label>
              <select
                id="mentor-sort"
                className="flex h-10 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                value={sortOrder}
                disabled={controlsLocked}
                onChange={(event) => handleSortChange(event.target.value as SortOrder)}
              >
                <option value="asc">Oldest first</option>
                <option value="desc">Newest first</option>
              </select>
            </div>
          </div>
        </div>

        {(actionMessage || actionError) && (
          <div className="space-y-2" aria-live="polite">
            {actionMessage ? <Alert variant="success">{actionMessage}</Alert> : null}
            {actionError ? <Alert variant="error">{actionError}</Alert> : null}
          </div>
        )}

        <SubmissionsTable
          items={items}
          pagination={pagination}
          loading={listLoading}
          error={listError}
          reviewingId={reviewingId}
          reviewLocked={pendingReview !== null}
          pageSize={PAGE_LIMIT}
          emptyMessage={
            searchQuery
              ? "No submissions match your search."
              : filter === "PENDING"
                ? "No submissions need review right now."
                : "No submissions match this filter."
          }
          onPageChange={handlePageChange}
          onReview={handleReviewRequest}
          onRetry={() => void refreshList(page, filter, searchQuery, sortOrder)}
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
      >
        <div className="space-y-2">
          <Label htmlFor="review-feedback">Feedback (optional)</Label>
          <Textarea
            id="review-feedback"
            value={feedbackDraft}
            onChange={(event) => setFeedbackDraft(event.target.value)}
            placeholder="Share brief notes for the student"
            disabled={reviewingId !== null}
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
