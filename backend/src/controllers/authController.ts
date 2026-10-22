import type { NextFunction, Request, Response } from "express";
import {
  getAuthenticatedUser,
  loginDemoMentor,
  loginUser,
  signupStudent,
  updateAuthenticatedUserProfile,
} from "../services/authService";
import { AppError } from "../utils/errors";
import { formatZodError } from "../utils/zod";
import { loginSchema, signupSchema, updateProfileSchema } from "../validators/auth";

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

export async function demoMentorLogin(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await loginDemoMentor();

    res.status(200).json({
      success: true,
      message: "Demo mentor login successful",
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

export async function updateProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.auth) {
      throw new AppError("Authentication required", 401);
    }

    const parsed = updateProfileSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError("Validation failed", 400, formatZodError(parsed.error));
    }

    const user = await updateAuthenticatedUserProfile(req.auth.id, parsed.data);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
}
