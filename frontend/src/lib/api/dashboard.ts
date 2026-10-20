import { apiRequest } from "./client";
import type { DashboardStats } from "./types";

export async function getDashboardStats(token: string): Promise<DashboardStats> {
  const data = await apiRequest<{ stats: DashboardStats }>("/api/dashboard/stats", {
    method: "GET",
    token,
  });

  return data.stats;
}
