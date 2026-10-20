import type { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";
import { normalizeEmail } from "../utils/email";

export type MentorSeedInput = {
  name: string;
  email: string;
  password: string;
};

export type MentorSeedResult =
  | { status: "created"; email: string }
  | { status: "unchanged"; email: string };

export async function seedMentorAccount(
  prisma: PrismaClient,
  input: MentorSeedInput,
): Promise<MentorSeedResult> {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const password = input.password;

  if (!name) {
    throw new Error("Mentor seed name is required.");
  }

  if (!email) {
    throw new Error("Mentor seed email is required.");
  }

  if (password.length < 8) {
    throw new Error("Mentor seed password must be at least 8 characters.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.role !== "MENTOR") {
      throw new Error(
        `Seed aborted: email "${email}" already belongs to a ${existing.role} account. ` +
          "Refusing to change role or password.",
      );
    }

    return { status: "unchanged", email };
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "MENTOR",
    },
  });

  return { status: "created", email };
}
