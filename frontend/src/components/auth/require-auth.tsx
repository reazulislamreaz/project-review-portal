"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LoadingState } from "@/components/feedback/loading-state";
import { useAuth } from "@/lib/auth/auth-context";
import { homePathForRole } from "@/lib/auth/routes";
import type { Role } from "@/lib/api/types";

type RequireAuthProps = {
  children: ReactNode;
  role?: Role;
  /** Shown inside a parent shell so the chrome does not unmount. */
  fallback?: ReactNode;
};

/**
 * Client-side gate for UX only. Backend endpoints still enforce JWT + RBAC.
 */
export function RequireAuth({ children, role, fallback }: RequireAuthProps) {
  const router = useRouter();
  const { status, user } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (status === "authenticated" && user && role && user.role !== role) {
      router.replace(homePathForRole(user.role));
    }
  }, [status, user, role, router]);

  const defaultFallback = (
    <LoadingState variant="panel" label="Checking your session..." />
  );

  if (status === "loading") {
    return <>{fallback ?? defaultFallback}</>;
  }

  if (status !== "authenticated" || !user) {
    return (
      <>
        {fallback ?? (
          <LoadingState variant="panel" label="Redirecting to login..." />
        )}
      </>
    );
  }

  if (role && user.role !== role) {
    return (
      <>{fallback ?? <LoadingState variant="panel" label="Redirecting..." />}</>
    );
  }

  return <>{children}</>;
}
