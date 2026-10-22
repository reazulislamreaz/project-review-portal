"use client";

import { use } from "react";
import { SubmissionDetail } from "@/components/mentor/submission-detail";

type MentorSubmissionDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default function MentorSubmissionDetailPage({
  params,
}: MentorSubmissionDetailPageProps) {
  const { id } = use(params);
  return <SubmissionDetail submissionId={id} />;
}
