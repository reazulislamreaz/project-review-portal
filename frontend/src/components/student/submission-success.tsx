"use client";

import { Alert } from "@/components/feedback/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SafeSubmission } from "@/lib/api/types";

type SubmissionSuccessProps = {
  submission: SafeSubmission;
};

export function SubmissionSuccess({ submission }: SubmissionSuccessProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Submission received</CardTitle>
        <CardDescription>
          Your project was submitted successfully. Mentors will review it soon.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="success" title={`Status: ${submission.status}`}>
          {submission.status === "PENDING"
            ? "Your submission is pending mentor review."
            : `Current status is ${submission.status}.`}
        </Alert>

        <dl className="space-y-3 text-sm">
          <div>
            <dt className="font-medium text-slate-800">Project name</dt>
            <dd className="mt-1 text-slate-600">{submission.projectName}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-800">Repository</dt>
            <dd className="mt-1 break-all text-slate-600">{submission.repoUrl}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-800">Live link</dt>
            <dd className="mt-1 break-all text-slate-600">{submission.liveUrl}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-800">Description</dt>
            <dd className="mt-1 whitespace-pre-wrap text-slate-600">{submission.description}</dd>
          </div>
        </dl>

        <p className="text-sm text-slate-600">
          Each student may submit only once. You can sign out anytime from the header.
        </p>
      </CardContent>
    </Card>
  );
}
