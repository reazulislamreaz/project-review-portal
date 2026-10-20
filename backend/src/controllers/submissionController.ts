import type { NextFunction, Request, Response } from "express";
import { createSubmissionForStudent } from "../services/submissionService";
import { AppError } from "../utils/errors";
import { formatZodError } from "../utils/zod";
import { createSubmissionSchema } from "../validators/submission";

export async function createSubmission(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.auth) {
      throw new AppError("Authentication required", 401);
    }

    const parsed = createSubmissionSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError("Validation failed", 400, formatZodError(parsed.error));
    }

    const submission = await createSubmissionForStudent(req.auth.id, parsed.data);

    res.status(201).json({
      success: true,
      message: "Submission created successfully",
      data: { submission },
    });
  } catch (error) {
    next(error);
  }
}
