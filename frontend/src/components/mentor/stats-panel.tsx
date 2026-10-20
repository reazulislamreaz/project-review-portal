"use client";

import { Alert } from "@/components/feedback/alert";
import type { DashboardStats } from "@/lib/api/types";

type StatsPanelProps = {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
};

const items: { key: keyof DashboardStats; label: string }[] = [
  { key: "totalPending", label: "Total pending" },
  { key: "totalApproved", label: "Total approved" },
  { key: "totalRejected", label: "Total rejected" },
  { key: "totalSubmissions", label: "Total submissions" },
];

export function StatsPanel({ stats, loading, error }: StatsPanelProps) {
  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.key}
          className="rounded-lg border border-border bg-surface px-4 py-4 sm:px-5"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-subtle">
            {item.label}
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
            {loading || !stats ? "—" : stats[item.key]}
          </p>
        </div>
      ))}
    </div>
  );
}
