import { apiRequest } from "./client";
import type {
  MentorSubmissionView,
  PaginatedSubmissions,
  ReviewStatus,
  SafeSubmission,
  SortOrder,
  SubmissionStatus,
} from "./types";

export type CreateSubmissionPayload = {
  projectName: string;
  repoUrl: string;
  liveUrl: string;
  description: string;
};

export type ListSubmissionsParams = {
  page?: number;
  limit?: number;
  status?: SubmissionStatus;
  q?: string;
  sortBy?: "createdAt";
  sortOrder?: SortOrder;
};

export async function createSubmission(
  payload: CreateSubmissionPayload,
  token: string,
): Promise<SafeSubmission> {
  const data = await apiRequest<{ submission: SafeSubmission }>("/api/submissions", {
    method: "POST",
    body: payload,
    token,
  });

  return data.submission;
}

/** Authenticated student's own submission, or null when none exists. */
export async function getMySubmission(token: string): Promise<SafeSubmission | null> {
  const data = await apiRequest<{ submission: SafeSubmission | null }>("/api/submissions/me", {
    method: "GET",
    token,
  });

  return data.submission;
}

/** Update a REJECTED submission in place and return it to PENDING. */
export async function resubmitSubmission(
  payload: CreateSubmissionPayload,
  token: string,
): Promise<SafeSubmission> {
  const data = await apiRequest<{ submission: SafeSubmission }>("/api/submissions/me", {
    method: "PATCH",
    body: payload,
    token,
  });

  return data.submission;
}

export async function listSubmissionsForMentor(
  token: string,
  params: ListSubmissionsParams = {},
): Promise<PaginatedSubmissions> {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 10));
  query.set("sortBy", params.sortBy ?? "createdAt");
  query.set("sortOrder", params.sortOrder ?? "desc");

  if (params.status) {
    query.set("status", params.status);
  }
  if (params.q && params.q.trim().length > 0) {
    query.set("q", params.q.trim());
  }

  return apiRequest<PaginatedSubmissions>(`/api/submissions?${query.toString()}`, {
    method: "GET",
    token,
  });
}

export async function updateSubmissionStatus(
  submissionId: string,
  status: ReviewStatus,
  token: string,
  feedback?: string | null,
): Promise<MentorSubmissionView> {
  const body: { status: ReviewStatus; feedback?: string | null } = { status };
  if (feedback !== undefined) {
    body.feedback = feedback;
  }

  const data = await apiRequest<{ submission: MentorSubmissionView }>(
    `/api/submissions/${encodeURIComponent(submissionId)}/status`,
    {
      method: "PATCH",
      body,
      token,
    },
  );

  return data.submission;
}
