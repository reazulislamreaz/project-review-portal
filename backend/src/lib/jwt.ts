import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { env } from "../config/env";
import { AppError } from "../utils/errors";

export type JwtPayload = {
  userId: string;
  role: Role;
};

const JWT_ALGORITHM: jwt.Algorithm = "HS256";

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    algorithm: JWT_ALGORITHM,
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, env.jwtSecret, {
      algorithms: [JWT_ALGORITHM],
    });

    if (typeof decoded !== "object" || decoded === null) {
      throw new AppError("Invalid or expired token", 401);
    }

    const { userId, role } = decoded as Partial<JwtPayload>;

    if (
      typeof userId !== "string" ||
      userId.trim() === "" ||
      (role !== "STUDENT" && role !== "MENTOR")
    ) {
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
