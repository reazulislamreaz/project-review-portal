import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

export type RateLimiterOptions = {
  /** Max requests allowed in the window. */
  max: number;
  /** Window length in milliseconds. */
  windowMs: number;
  /** Stable key for the caller (e.g. authenticated user id). */
  keyFn: (req: Request) => string;
  message?: string;
};

/**
 * Simple in-memory fixed-window rate limiter.
 * Suitable for a single Node process; not shared across multiple instances.
 * Expired keys are pruned on each request so memory stays bounded.
 */
export function createRateLimiter(options: RateLimiterOptions) {
  const store = new Map<string, RateLimitEntry>();
  const message = options.message ?? "Too many requests. Please try again later.";

  function pruneExpired(now: number): void {
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt <= now) {
        store.delete(key);
      }
    }
  }

  function clear(): void {
    store.clear();
  }

  function size(): number {
    return store.size;
  }

  function middleware(req: Request, _res: Response, next: NextFunction): void {
    try {
      const now = Date.now();
      pruneExpired(now);

      const key = options.keyFn(req);
      const existing = store.get(key);

      const entry =
        !existing || existing.resetAt <= now
          ? { count: 0, resetAt: now + options.windowMs }
          : existing;

      entry.count += 1;
      store.set(key, entry);

      if (entry.count > options.max) {
        next(new AppError(message, 429));
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  }

  return { middleware, clear, size };
}
