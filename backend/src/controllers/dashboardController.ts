import type { NextFunction, Request, Response } from "express";
import { getDashboardStats } from "../services/dashboardService";

export async function getStats(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const stats = await getDashboardStats();

    res.status(200).json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
}
