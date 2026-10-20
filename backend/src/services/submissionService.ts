import { Prisma, type Submission, type SubmissionStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/errors";
import type { CreateSubmissionInput } from "../validators/submission";
import type {
  ListSubmissionsQuery,
  UpdateSubmissionStatusInput,
} from "../validators/review";

export type SafeStudentSummary = {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "MENTOR";
};

export type SafeSubmission = {
  id: string;
  projectName: string;
  repoUrl: string;
  liveUrl: string;
  description: string;
  status: Submission["status"];
  feedback: string | null;
  reviewedAt: Date | null;
  studentId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type MentorSubmissionView = SafeSubmission & {
  student: SafeStudentSummary;
};

export type PaginatedSubmissions = {
  items: MentorSubmissionView[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const studentSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
} as const;

function toSafeSubmission(submission: Submission): SafeSubmission {
  return {
    id: submission.id,
    projectName: submission.projectName,
    repoUrl: submission.repoUrl,
    liveUrl: submission.liveUrl,
    description: submission.description,
    status: submission.status,
    feedback: submission.feedback,
    reviewedAt: submission.reviewedAt,
    studentId: submission.studentId,
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
  };
}

function toMentorSubmissionView(
  submission: Submission & { student: SafeStudentSummary },
): MentorSubmissionView {
  return {
    ...toSafeSubmission(submission),
    student: submission.student,
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
 * Return the authenticated student's own submission, or null when none exists.
 * Looks up by JWT-derived studentId only — never by a client-supplied id.
 */
export async function getSubmissionForStudent(
  studentId: string,
): Promise<SafeSubmission | null> {
  const submission = await prisma.submission.findUnique({
    where: { studentId },
  });

  return submission ? toSafeSubmission(submission) : null;
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

/** Mentor listing with optional status filter, search, sort, and pagination. */
export async function listSubmissionsForMentor(
  query: ListSubmissionsQuery,
): Promise<PaginatedSubmissions> {
  const where: Prisma.SubmissionWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.q
      ? {
          OR: [
            { projectName: { contains: query.q, mode: "insensitive" } },
            { student: { email: { contains: query.q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const skip = (query.page - 1) * query.limit;
  const sortOrder = query.sortOrder;
  // Deterministic secondary sort on id matching primary direction.
  const orderBy: Prisma.SubmissionOrderByWithRelationInput[] = [
    { [query.sortBy]: sortOrder },
    { id: sortOrder },
  ];

  const [total, rows] = await prisma.$transaction([
    prisma.submission.count({ where }),
    prisma.submission.findMany({
      where,
      skip,
      take: query.limit,
      orderBy,
      include: {
        student: { select: studentSelect },
      },
    }),
  ]);

  const totalPages = total === 0 ? 0 : Math.ceil(total / query.limit);

  return {
    items: rows.map(toMentorSubmissionView),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages,
    },
  };
}

/**
 * Approve or reject a pending submission, optionally with mentor feedback.
 * Concurrent-safe: update only succeeds when current status is still PENDING.
 * Status, feedback, and reviewedAt are written in one update.
 */
export async function updateSubmissionStatusForMentor(
  submissionId: string,
  input: UpdateSubmissionStatusInput,
): Promise<MentorSubmissionView> {
  const nextStatus: SubmissionStatus = input.status;
  const reviewedAt = new Date();

  const updated = await prisma.submission.updateMany({
    where: {
      id: submissionId,
      status: "PENDING",
    },
    data: {
      status: nextStatus,
      feedback: input.feedback,
      reviewedAt,
    },
  });

  if (updated.count === 1) {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        student: { select: studentSelect },
      },
    });

    if (!submission) {
      throw new AppError("Submission not found", 404);
    }

    return toMentorSubmissionView(submission);
  }

  const existing = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: { id: true, status: true },
  });

  if (!existing) {
    throw new AppError("Submission not found", 404);
  }

  throw new AppError("Submission has already been reviewed", 409);
}
