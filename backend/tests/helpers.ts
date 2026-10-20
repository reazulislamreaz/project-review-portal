import { prisma } from "../src/lib/prisma";

export async function resetDatabase(): Promise<void> {
  await prisma.submission.deleteMany();
  await prisma.user.deleteMany();
}
