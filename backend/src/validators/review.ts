import { z } from "zod";

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 50;

export const listSubmissionsQuerySchema = z
  .object({
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
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

export const updateSubmissionStatusSchema = z
  .object({
    status: z.enum(["APPROVED", "REJECTED"], {
      error: "Status must be APPROVED or REJECTED",
    }),
  })
  .strict();

export type ListSubmissionsQuery = z.infer<typeof listSubmissionsQuerySchema>;
export type UpdateSubmissionStatusInput = z.infer<typeof updateSubmissionStatusSchema>;
