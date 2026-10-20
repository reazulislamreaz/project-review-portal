import type { NextFunction, Request, Response } from "express";
import { isAppError } from "../utils/errors";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (isAppError(err)) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details !== undefined ? { errors: err.details } : {}),
    });
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}
