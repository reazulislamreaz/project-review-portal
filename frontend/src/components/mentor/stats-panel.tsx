"use client";

import { Alert } from "@/components/feedback/alert";
import type { DashboardStats } from "@/lib/api/types";

type StatsPanelProps = {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
};

const items: { key: keyof DashboardStats; label: string }[] = [
  { key: "totalPending", label: "Pending" },
  { key: "totalApproved", label: "Approved" },
  { key: "totalRejected", label: "Rejected" },
  { key: "totalSubmissions", label: "Total" },
];

export function StatsPanel({ stats, loading, error }: StatsPanelProps) {
  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.key} className="bg-surface px-4 py-4 sm:px-5">
          <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
            {loading || !stats ? "—" : stats[item.key]}
          </p>
        </div>
      ))}
    </div>
  );
}
