"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingState } from "@/components/feedback/loading-state";
import { useAuth } from "@/lib/auth/auth-context";
import { homePathForRole } from "@/lib/auth/routes";

type GuestOnlyProps = {
  children: React.ReactNode;
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
    return <LoadingState label="Checking your session..." />;
  }

  if (status === "authenticated") {
    return <LoadingState label="Redirecting..." />;
  }

  return <>{children}</>;
}
