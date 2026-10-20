import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { env } from "../config/env";
import { AppError } from "../utils/errors";

export type JwtPayload = {
  userId: string;
  role: Role;
};

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, env.jwtSecret);

    if (typeof decoded !== "object" || decoded === null) {
      throw new AppError("Invalid or expired token", 401);
    }

    const { userId, role } = decoded as Partial<JwtPayload>;

    if (typeof userId !== "string" || (role !== "STUDENT" && role !== "MENTOR")) {
      throw new AppError("Invalid or expired token", 401);
    }

    return { userId, role };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Invalid or expired token", 401);
  }
}
