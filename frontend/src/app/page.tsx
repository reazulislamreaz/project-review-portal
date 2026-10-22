"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/layout/auth-shell";
import { LoadingState } from "@/components/feedback/loading-state";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { homePathForRole } from "@/lib/auth/routes";

export default function HomePage() {
  const router = useRouter();
  const { status, user } = useAuth();

  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace(homePathForRole(user.role));
    }
  }, [status, user, router]);

  if (status === "loading") {
    return (
      <AuthShell>
        <div className="flex min-h-[22rem] items-center justify-center rounded-lg border border-border bg-surface">
          <LoadingState variant="panel" label="Loading..." />
        </div>
      </AuthShell>
    );
  }

  if (status === "authenticated") {
    return (
      <AuthShell>
        <div className="flex min-h-[22rem] items-center justify-center rounded-lg border border-border bg-surface">
          <LoadingState variant="panel" label="Redirecting..." />
        </div>
      </AuthShell>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center gap-8 px-4 py-16 sm:px-6">
      <div className="space-y-4">
        <p className="text-sm font-medium text-muted-foreground">
          Project Submission Dashboard
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Submit projects. Review with clarity.
        </h1>
        <p className="text-base leading-relaxed text-subtle">
          Students submit project work for review. Mentors approve or reject submissions from
          a single dashboard.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button className="sm:flex-1" onClick={() => router.push("/signup")}>
          Student sign up
        </Button>
        <Button variant="outline" className="sm:flex-1" onClick={() => router.push("/login")}>
          Log in
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Already registered?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Go to login
        </Link>
      </p>
    </main>
  );
}
