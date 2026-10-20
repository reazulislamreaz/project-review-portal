import { env } from "../config/env";
import { createRateLimiter } from "./rateLimit";

/**
 * B0 D2 / assignment: basic anti-spam limit on project submission.
 * Keyed by authenticated student id (preferred over IP for logged-in routes).
 * In-memory only — resets on process restart; not shared across instances.
 */
const limiter = createRateLimiter({
  max: env.submissionRateLimitMax,
  windowMs: env.submissionRateLimitWindowMs,
  keyFn: (req) => {
    if (!req.auth) {
      return "anonymous";
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
