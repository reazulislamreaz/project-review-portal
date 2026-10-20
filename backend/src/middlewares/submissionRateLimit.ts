import { AppError } from "../utils/errors";
import { env } from "../config/env";
import { createRateLimiter } from "./rateLimit";

/**
 * B0 D2 / assignment: basic anti-spam limit on project submission.
 * Keyed by authenticated student id (preferred over IP for logged-in routes).
 * In-memory only — resets on process restart; not shared across instances.
 * Applied only to POST /api/submissions after authenticate + authorize.
 */
const limiter = createRateLimiter({
  max: env.submissionRateLimitMax,
  windowMs: env.submissionRateLimitWindowMs,
  keyFn: (req) => {
    if (!req.auth) {
      // Fail closed: this middleware must run after authenticate.
      throw new AppError("Authentication required", 401);
    }

    return `submission:${req.auth.id}`;
  },
  message: "Too many submission attempts. Please try again later.",
});

export const submissionRateLimit = limiter.middleware;

/** Test helper to reset the in-memory window between cases. */
export function clearSubmissionRateLimit(): void {
  limiter.clear();
}

/** Test helper to observe store size after prune behavior. */
export function getSubmissionRateLimitStoreSize(): number {
  return limiter.size();
}
