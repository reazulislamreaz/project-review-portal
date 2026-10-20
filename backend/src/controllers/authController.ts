import type { NextFunction, Request, Response } from "express";
import { getAuthenticatedUser, loginUser, signupStudent } from "../services/authService";
import { AppError } from "../utils/errors";
import { loginSchema, signupSchema } from "../validators/auth";

function formatZodError(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  return error.issues.map((issue) => ({
    field: issue.path.map(String).join(".") || "body",
    message: issue.message,
  }));
}

export async function signup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = signupSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError("Validation failed", 400, formatZodError(parsed.error));
    }

    const result = await signupStudent(parsed.data);

    res.status(201).json({
      success: true,
      message: "Student registered successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError("Validation failed", 400, formatZodError(parsed.error));
    }

    const result = await loginUser(parsed.data);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.auth) {
      throw new AppError("Authentication required", 401);
    }

    const user = await getAuthenticatedUser(req.auth.id);

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}
