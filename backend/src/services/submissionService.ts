import { Prisma, type Submission } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/errors";
import type { CreateSubmissionInput } from "../validators/submission";

export type SafeSubmission = {
  id: string;
  projectName: string;
  repoUrl: string;
  liveUrl: string;
  description: string;
  status: Submission["status"];
  studentId: string;
  createdAt: Date;
  updatedAt: Date;
};

function toSafeSubmission(submission: Submission): SafeSubmission {
  return {
    id: submission.id,
    projectName: submission.projectName,
    repoUrl: submission.repoUrl,
    liveUrl: submission.liveUrl,
    description: submission.description,
    status: submission.status,
    studentId: submission.studentId,
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
  };
}

function isStudentIdUniqueViolation(error: Prisma.PrismaClientKnownRequestError): boolean {
  const target = error.meta?.target;

  if (Array.isArray(target)) {
    return target.includes("studentId");
  }

  if (typeof target === "string") {
    return target === "studentId" || target.includes("studentId");
  }

  return false;
}

/**
 * Create a project submission for the authenticated student.
 * Duplicate policy (B0 D1 / B2 unique studentId): one submission per student.
 */
export async function createSubmissionForStudent(
  studentId: string,
  input: CreateSubmissionInput,
): Promise<SafeSubmission> {
  try {
    const submission = await prisma.submission.create({
      data: {
        projectName: input.projectName,
        repoUrl: input.repoUrl,
        liveUrl: input.liveUrl,
        description: input.description,
        status: "PENDING",
        studentId,
      },
    });

    return toSafeSubmission(submission);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      isStudentIdUniqueViolation(error)
    ) {
      throw new AppError("You have already submitted a project", 409);
    }

    throw error;
  }
}
