import { z } from "zod";

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 50;
export const MAX_FEEDBACK_LENGTH = 2000;

export const listSubmissionsQuerySchema = z
  .object({
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
    /** Case-insensitive search across project name and student email. */
    q: z
      .string()
      .trim()
      .max(200, "Search query must be at most 200 characters")
      .optional()
      .transform((value) => (value && value.length > 0 ? value : undefined)),
    sortBy: z.enum(["createdAt"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
    page: z.coerce.number().int().min(1, "page must be an integer >= 1").default(DEFAULT_PAGE),
    limit: z.coerce
      .number()
      .int()
      .min(1, "limit must be an integer >= 1")
      .max(MAX_LIMIT, `limit must be at most ${MAX_LIMIT}`)
      .default(DEFAULT_LIMIT),
  })
  .strict();

export const submissionIdParamSchema = z
  .object({
    id: z
      .string({ error: "Submission id is required" })
      .trim()
      .min(1, "Submission id is required")
      .max(64, "Submission id is invalid"),
  })
  .strict();

/**
 * Empty / whitespace-only feedback is stored as null (optional feedback).
 * Non-empty feedback is trimmed and length-limited.
 */
export const updateSubmissionStatusSchema = z
  .object({
    status: z.enum(["APPROVED", "REJECTED"], {
      error: "Status must be APPROVED or REJECTED",
    }),
    feedback: z
      .string()
      .max(MAX_FEEDBACK_LENGTH, `Feedback must be at most ${MAX_FEEDBACK_LENGTH} characters`)
      .optional()
      .nullable()
      .transform((value) => {
        if (value === undefined || value === null) {
          return null;
        }
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
      }),
  })
  .strict();

export type ListSubmissionsQuery = z.infer<typeof listSubmissionsQuerySchema>;
export type UpdateSubmissionStatusInput = z.infer<typeof updateSubmissionStatusSchema>;
