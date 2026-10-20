import type { NextFunction, Request, Response } from "express";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const message = err instanceof Error ? err.message : "Internal server error";

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  res.status(500).json({
    success: false,
    message,
  });
}
