import { cn } from "@/lib/utils";

type LoadingStateProps = {
  label?: string;
  /**
   * `page` — full-viewport guest redirects.
   * `panel` — in-shell / card-sized area (avoids collapsing portal layout).
   */
  variant?: "page" | "panel";
  className?: string;
};

export function LoadingState({
  label = "Loading...",
  variant = "page",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center px-4",
        variant === "page" && "min-h-[40vh]",
        variant === "panel" && "min-h-[12rem] w-full",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <p className="text-sm text-subtle">{label}</p>
    </div>
  );
}
