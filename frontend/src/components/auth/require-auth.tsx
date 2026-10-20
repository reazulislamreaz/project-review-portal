"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingState } from "@/components/feedback/loading-state";
import { useAuth } from "@/lib/auth/auth-context";
import { homePathForRole } from "@/lib/auth/routes";
import type { Role } from "@/lib/api/types";

type RequireAuthProps = {
  children: React.ReactNode;
  role?: Role;
};

/**
 * Client-side gate for UX only. Backend endpoints still enforce JWT + RBAC.
 */
export function RequireAuth({ children, role }: RequireAuthProps) {
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

  if (status === "loading") {
    return <LoadingState label="Checking your session..." />;
  }

  if (status !== "authenticated" || !user) {
    return <LoadingState label="Redirecting to login..." />;
  }

  if (role && user.role !== role) {
    return <LoadingState label="Redirecting..." />;
  }

  return <>{children}</>;
}
