"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/layout/auth-shell";
import { LoadingState } from "@/components/feedback/loading-state";
import { useAuth } from "@/lib/auth/auth-context";
import { homePathForRole } from "@/lib/auth/routes";

type GuestOnlyProps = {
  children: ReactNode;
};

export function GuestOnly({ children }: GuestOnlyProps) {
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
          <LoadingState variant="panel" label="Checking your session..." />
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

  return <>{children}</>;
}
