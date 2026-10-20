import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { seedMentorAccount } from "../src/services/seedService";

dotenv.config();

const prisma = new PrismaClient();

function requireSeedValue(name: string, value: string | undefined): string {
  if (value === undefined || value.trim() === "") {
    throw new Error(`Missing required seed environment variable: ${name}`);
  }

  return value.trim();
}

async function main(): Promise<void> {
  const result = await seedMentorAccount(prisma, {
    name: requireSeedValue("MENTOR_SEED_NAME", process.env.MENTOR_SEED_NAME),
    email: requireSeedValue("MENTOR_SEED_EMAIL", process.env.MENTOR_SEED_EMAIL),
    password: requireSeedValue("MENTOR_SEED_PASSWORD", process.env.MENTOR_SEED_PASSWORD),
  });

  if (result.status === "created") {
    console.log(`Mentor account created for ${result.email}.`);
    return;
  }

  console.log(`Mentor account already exists for ${result.email}; leaving it unchanged.`);
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown seed error";
    console.error(`Seed failed: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
