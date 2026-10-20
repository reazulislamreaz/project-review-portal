"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/feedback/alert";
import { FieldError } from "@/components/feedback/field-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createSubmission } from "@/lib/api/submissions";
import { ApiError, type SafeSubmission } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { createSubmissionFormSchema } from "@/lib/validation/submission";

type FieldKey = "projectName" | "repoUrl" | "liveUrl" | "description";
type FieldErrors = Partial<Record<FieldKey, string>>;

function mapApiFieldErrors(fieldErrors: ApiError["fieldErrors"]): FieldErrors {
  const next: FieldErrors = {};
  for (const item of fieldErrors) {
    if (
      item.field === "projectName" ||
      item.field === "repoUrl" ||
      item.field === "liveUrl" ||
      item.field === "description"
    ) {
      next[item.field] = item.message;
    }
  }
  return next;
}

function messageForApiError(error: ApiError): string {
  switch (error.status) {
    case 400:
      return error.message || "Please fix the highlighted fields and try again.";
    case 401:
      return "Your session has expired. Please log in again.";
    case 403:
      return "You do not have permission to submit a project. Only student accounts can submit.";
    case 409:
      return (
        error.message ||
        "You have already submitted a project. Each student may submit only once."
      );
    case 429:
      return (
        error.message ||
        "Too many submission attempts. Please wait a few minutes and try again."
      );
    case 0:
      return error.message;
    default:
      return error.message || "Unable to submit your project. Please try again.";
  }
}

type SubmissionFormProps = {
  onSuccess: (submission: SafeSubmission) => void;
};

export function SubmissionForm({ onSuccess }: SubmissionFormProps) {
  const router = useRouter();
  const { token, logout } = useAuth();

  const [projectName, setProjectName] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [description, setDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (submitting) {
      return;
    }

    const parsed = createSubmissionFormSchema.safeParse({
      projectName,
      repoUrl,
      liveUrl,
      description,
    });

    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (
          key === "projectName" ||
          key === "repoUrl" ||
          key === "liveUrl" ||
          key === "description"
        ) {
          nextErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    if (!token) {
      logout();
      router.replace("/login");
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      const submission = await createSubmission(parsed.data, token);
      onSuccess(submission);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          logout();
          router.replace("/login");
          return;
        }

        if (error.fieldErrors.length > 0) {
          setFieldErrors(mapApiFieldErrors(error.fieldErrors));
        }

        setFormError(messageForApiError(error));
      } else {
        setFormError("Unable to submit your project. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Submit your project</CardTitle>
        <CardDescription>
          Provide your project details below. Each student may submit only once.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          {formError ? <Alert variant="error">{formError}</Alert> : null}

          <div className="space-y-2">
            <Label htmlFor="projectName">Project name</Label>
            <Input
              id="projectName"
              name="projectName"
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              aria-invalid={Boolean(fieldErrors.projectName)}
              aria-describedby={fieldErrors.projectName ? "projectName-error" : undefined}
              disabled={submitting}
              autoComplete="off"
            />
            <FieldError id="projectName-error" message={fieldErrors.projectName} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="repoUrl">GitHub repository URL</Label>
            <Input
              id="repoUrl"
              name="repoUrl"
              type="url"
              inputMode="url"
              placeholder="https://github.com/username/project"
              value={repoUrl}
              onChange={(event) => setRepoUrl(event.target.value)}
              aria-invalid={Boolean(fieldErrors.repoUrl)}
              aria-describedby={fieldErrors.repoUrl ? "repoUrl-error" : undefined}
              disabled={submitting}
              autoComplete="off"
            />
            <FieldError id="repoUrl-error" message={fieldErrors.repoUrl} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="liveUrl">Live project URL</Label>
            <Input
              id="liveUrl"
              name="liveUrl"
              type="url"
              inputMode="url"
              placeholder="https://your-project.example.com"
              value={liveUrl}
              onChange={(event) => setLiveUrl(event.target.value)}
              aria-invalid={Boolean(fieldErrors.liveUrl)}
              aria-describedby={fieldErrors.liveUrl ? "liveUrl-error" : undefined}
              disabled={submitting}
              autoComplete="off"
            />
            <FieldError id="liveUrl-error" message={fieldErrors.liveUrl} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Project description</Label>
            <Textarea
              id="description"
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              aria-invalid={Boolean(fieldErrors.description)}
              aria-describedby={fieldErrors.description ? "description-error" : undefined}
              disabled={submitting}
            />
            <FieldError id="description-error" message={fieldErrors.description} />
          </div>

          <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit project"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
