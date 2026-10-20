import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/jwt";
import { AppError } from "../utils/errors";

function extractBearerToken(header: string | undefined): string {
  if (!header) {
    throw new AppError("Authentication required", 401);
  }

  const match = /^(Bearer)\s+(\S+)$/i.exec(header.trim());

  if (!match) {
    throw new AppError("Authentication required", 401);
  }

  return match[2];
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const token = extractBearerToken(req.headers.authorization);
    const payload = verifyAccessToken(token);

    req.auth = {
      id: payload.userId,
      role: payload.role,
    };

    next();
  } catch (error) {
    next(error);
  }
}
