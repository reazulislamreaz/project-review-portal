import { apiRequest } from "./client";
import type { SafeSubmission } from "./types";

export type CreateSubmissionPayload = {
  projectName: string;
  repoUrl: string;
  liveUrl: string;
  description: string;
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
