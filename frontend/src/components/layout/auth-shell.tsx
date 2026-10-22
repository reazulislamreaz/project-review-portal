import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Shared guest chrome for login/signup/home loading states.
 * Keeps container width and vertical centering stable across auth routes.
 */
export function AuthShell({ children, className }: AuthShellProps) {
  return (
    <main
      className={cn(
        "flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6",
        className,
      )}
    >
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
