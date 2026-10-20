import type { Role } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors";

/**
 * Authorization middleware: requires authenticate to have run first.
 * Checks the verified JWT role against the allowed roles.
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      next(new AppError("Authentication required", 401));
      return;
    }

    if (!allowedRoles.includes(req.auth.role)) {
      next(new AppError("Forbidden", 403));
      return;
    }

    next();
  };
}
