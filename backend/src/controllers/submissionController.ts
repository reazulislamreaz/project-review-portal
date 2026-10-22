import type { NextFunction, Request, Response } from "express";
import {
  createSubmissionForStudent,
  getSubmissionForStudent,
  listSubmissionsForMentor,
  resubmitSubmissionForStudent,
  updateSubmissionStatusForMentor,
} from "../services/submissionService";
import { AppError } from "../utils/errors";
import { formatZodError } from "../utils/zod";
import {
  listSubmissionsQuerySchema,
  submissionIdParamSchema,
  updateSubmissionStatusSchema,
} from "../validators/review";
import {
  createSubmissionSchema,
  resubmitSubmissionSchema,
} from "../validators/submission";

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

export async function getMySubmission(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.auth) {
      throw new AppError("Authentication required", 401);
    }

    const submission = await getSubmissionForStudent(req.auth.id);

    res.status(200).json({
      success: true,
      data: { submission },
    });
  } catch (error) {
    next(error);
  }
}

export async function resubmitSubmission(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.auth) {
      throw new AppError("Authentication required", 401);
    }

    const parsed = resubmitSubmissionSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError("Validation failed", 400, formatZodError(parsed.error));
    }

    const submission = await resubmitSubmissionForStudent(req.auth.id, parsed.data);

    res.status(200).json({
      success: true,
      message: "Submission updated and returned to pending review",
      data: { submission },
    });
  } catch (error) {
    next(error);
  }
}

export async function listSubmissions(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = listSubmissionsQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      throw new AppError("Validation failed", 400, formatZodError(parsed.error));
    }

    const result = await listSubmissionsForMentor(parsed.data);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSubmissionStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = submissionIdParamSchema.safeParse(req.params);

    if (!params.success) {
      throw new AppError("Validation failed", 400, formatZodError(params.error));
    }

    const body = updateSubmissionStatusSchema.safeParse(req.body);

    if (!body.success) {
      throw new AppError("Validation failed", 400, formatZodError(body.error));
    }

    const submission = await updateSubmissionStatusForMentor(params.data.id, body.data);

    res.status(200).json({
      success: true,
      message: `Submission ${body.data.status.toLowerCase()} successfully`,
      data: { submission },
    });
  } catch (error) {
    next(error);
  }
}
