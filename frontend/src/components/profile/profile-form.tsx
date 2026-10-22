"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/feedback/alert";
import { FieldError } from "@/components/feedback/field-error";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { formatSubmissionDate } from "@/lib/mentor/format";
import { updateProfileFormSchema } from "@/lib/validation/auth";

type FieldErrors = Partial<Record<"name", string>>;

export function ProfileForm() {
  const router = useRouter();
  const { user, updateProfile, logout } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
    }
  }, [user]);

  if (!user) {
    return null;
  }

  const roleLabel = user.role === "MENTOR" ? "Mentor" : "Student";
  const dirty = name.trim() !== user.name;
  const canSave = dirty && !submitting;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const parsed = updateProfileFormSchema.safeParse({ name });
    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === "name") {
          nextErrors.name = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      const updated = await updateProfile(parsed.data.name);
      setName(updated.name);
      setSuccessMessage("Profile updated successfully.");
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          logout();
          router.replace("/login");
          return;
        }
        if (error.fieldErrors.length > 0) {
          const nextErrors: FieldErrors = {};
          for (const item of error.fieldErrors) {
            if (item.field === "name") {
              nextErrors.name = item.message;
            }
          }
          setFieldErrors(nextErrors);
        }
        setFormError(error.message);
      } else {
        setFormError("Unable to update your profile. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full min-w-0 space-y-8">
      <PageHeader
        title="Your profile"
        description="View your account details and update your display name. Email cannot be changed."
      />

      <Card className="w-full min-w-0">
        <CardHeader>
          <CardTitle as="h2">Account</CardTitle>
          <CardDescription>
            Changes apply immediately to your account across the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            {formError ? <Alert variant="error">{formError}</Alert> : null}
            {successMessage ? <Alert variant="success">{successMessage}</Alert> : null}

            <div className="space-y-2">
              <Label htmlFor="profile-name">Name</Label>
              <Input
                id="profile-name"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setSuccessMessage(null);
                }}
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? "profile-name-error" : undefined}
                disabled={submitting}
              />
              <FieldError id="profile-name-error" message={fieldErrors.name} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input
                id="profile-email"
                name="email"
                type="email"
                value={user.email}
                readOnly
                disabled
                aria-readonly="true"
                aria-describedby="profile-email-help"
              />
              <p id="profile-email-help" className="text-xs text-muted-foreground">
                Email is view-only and cannot be changed here.
              </p>
            </div>

            <dl className="grid gap-3 rounded-md border border-border bg-muted/40 px-4 py-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Role</dt>
                <dd className="mt-1 text-foreground">{roleLabel}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Member since</dt>
                <dd className="mt-1 text-foreground">
                  {user.createdAt ? formatSubmissionDate(user.createdAt) : "—"}
                </dd>
              </div>
            </dl>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={!dirty || submitting}
                onClick={() => {
                  setName(user.name);
                  setFieldErrors({});
                  setFormError(null);
                  setSuccessMessage(null);
                }}
              >
                Reset
              </Button>
              <Button type="submit" disabled={!canSave}>
                {submitting ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
