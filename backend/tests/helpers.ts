import { prisma } from "../src/lib/prisma";
import { assertSafeTestDatabaseUrl } from "./dbGuard";

export async function resetDatabase(): Promise<void> {
  assertSafeTestDatabaseUrl(process.env.DATABASE_URL);

  await prisma.submission.deleteMany();
  await prisma.user.deleteMany();
}
