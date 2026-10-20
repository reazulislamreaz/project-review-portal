import { apiRequest } from "./client";
import type {
  MentorSubmissionView,
  PaginatedSubmissions,
  ReviewStatus,
  SafeSubmission,
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

export async function listSubmissionsForMentor(
  token: string,
  params: ListSubmissionsParams = {},
): Promise<PaginatedSubmissions> {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 10));

  if (params.status) {
    query.set("status", params.status);
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
): Promise<MentorSubmissionView> {
  const data = await apiRequest<{ submission: MentorSubmissionView }>(
    `/api/submissions/${encodeURIComponent(submissionId)}/status`,
    {
      method: "PATCH",
      body: { status },
      token,
    },
  );

  return data.submission;
}
