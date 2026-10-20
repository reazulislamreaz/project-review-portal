import type { SubmissionStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";

export type DashboardStats = {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  totalSubmissions: number;
};

/** Aggregate counts via DB groupBy — does not fetch submission rows. */
export async function getDashboardStats(): Promise<DashboardStats> {
  const grouped = await prisma.submission.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const counts: Record<SubmissionStatus, number> = {
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
  };

  for (const row of grouped) {
    counts[row.status] = row._count._all;
  }

  const totalPending = counts.PENDING;
  const totalApproved = counts.APPROVED;
  const totalRejected = counts.REJECTED;

  return {
    totalPending,
    totalApproved,
    totalRejected,
    totalSubmissions: totalPending + totalApproved + totalRejected,
  };
}
