import { Prisma, type Role, type User } from "@prisma/client";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { hashPassword, verifyPassword } from "../lib/password";
import { signAccessToken } from "../lib/jwt";
import { normalizeEmail } from "../utils/email";
import { AppError } from "../utils/errors";
import type { LoginInput, SignupInput, UpdateProfileInput } from "../validators/auth";

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
};

export type AuthResult = {
  user: SafeUser;
  token: string;
};

function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

function issueAuthResult(user: User): AuthResult {
  const safeUser = toSafeUser(user);
  const token = signAccessToken({
    userId: safeUser.id,
    role: safeUser.role,
  });

  return { user: safeUser, token };
}

export async function signupStudent(input: SignupInput): Promise<AuthResult> {
  const email = normalizeEmail(input.email);
  const passwordHash = await hashPassword(input.password);

  try {
    const user = await prisma.user.create({
      data: {
        name: input.name.trim(),
        email,
        passwordHash,
        role: "STUDENT",
      },
    });

    return issueAuthResult(user);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError("Email is already registered", 409);
    }

    throw error;
  }
}

/** Precomputed bcrypt hash used only to keep login timing similar when no user exists. */
const LOGIN_DUMMY_PASSWORD_HASH =
  "$2b$12$CDCrDH3s6BsNPc1uqTDXruqocbHqO1A1TRNeVw4LDvGyanb7RWeX2";

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const email = normalizeEmail(input.email);
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    try {
      await verifyPassword(input.password, LOGIN_DUMMY_PASSWORD_HASH);
    } catch {
      // Ignore dummy-hash comparison failures; response must stay generic.
    }
    throw new AppError("Invalid email or password", 401);
  }

  const passwordMatches = await verifyPassword(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError("Invalid email or password", 401);
  }

  return issueAuthResult(user);
}

export async function getAuthenticatedUser(userId: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return toSafeUser(user);
}

/**
 * One-click demo mentor login for the public demo.
 * Uses seeded mentor credentials from server env (password never sent to the browser).
 */
export async function loginDemoMentor(): Promise<AuthResult> {
  const email = env.mentorSeedEmail?.trim();
  const password = env.mentorSeedPassword;

  if (!email || !password) {
    throw new AppError(
      "Demo mentor login is not configured. Set MENTOR_SEED_EMAIL and MENTOR_SEED_PASSWORD.",
      503,
    );
  }

  const result = await loginUser({ email, password });

  if (result.user.role !== "MENTOR") {
    throw new AppError("Demo mentor account is misconfigured", 500);
  }

  return result;
}

/** Updates the caller's own profile. Email is intentionally not accepted. */
export async function updateAuthenticatedUserProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<SafeUser> {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name: input.name.trim() },
    });
    return toSafeUser(user);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new AppError("User not found", 404);
    }
    throw error;
  }
}
