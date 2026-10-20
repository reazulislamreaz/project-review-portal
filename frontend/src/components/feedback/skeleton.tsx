import { cn } from "@/lib/utils";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      aria-hidden="true"
    />
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" aria-busy="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="rounded-lg border border-border bg-surface px-4 py-4 sm:px-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-7 w-12" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" role="status">
      <p className="sr-only">Loading…</p>
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="border-b border-border bg-muted/50 px-4 py-3">
          <Skeleton className="h-3 w-full max-w-xl" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: rows }, (_, index) => (
            <div key={index} className="flex gap-4 px-4 py-3.5">
              <Skeleton className="h-4 w-1/6" />
              <Skeleton className="h-4 w-1/5" />
              <Skeleton className="h-4 w-1/6" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="space-y-4 rounded-lg border border-border bg-surface p-5 sm:p-6" aria-busy="true">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-4 w-full max-w-md" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
