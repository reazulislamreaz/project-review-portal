"use client";

import { Alert } from "@/components/feedback/alert";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.key}>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {item.label}
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">
              {loading || !stats ? "—" : stats[item.key]}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
