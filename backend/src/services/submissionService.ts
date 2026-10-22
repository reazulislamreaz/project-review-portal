import { Prisma, type Submission, type SubmissionStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/errors";
import type {
  CreateSubmissionInput,
  ResubmitSubmissionInput,
} from "../validators/submission";
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
  previousFeedback: string | null;
  reviewedAt: Date | null;
  resubmittedAt: Date | null;
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
    previousFeedback: submission.previousFeedback,
    reviewedAt: submission.reviewedAt,
    resubmittedAt: submission.resubmittedAt,
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

function conflictErrorForStatus(status: SubmissionStatus): AppError {
  switch (status) {
    case "PENDING":
      return new AppError(
        "Your submission is pending mentor review and cannot be changed or resubmitted",
        409,
      );
    case "APPROVED":
      return new AppError(
        "Your submission was approved and is locked. It cannot be edited or resubmitted",
        409,
      );
    case "REJECTED":
      return new AppError(
        "Your submission was rejected. Update and resubmit it instead of creating a new submission",
        409,
      );
    default:
      return new AppError("You have already submitted a project", 409);
  }
}

async function throwCreateConflictForStudent(studentId: string): Promise<never> {
  const existing = await prisma.submission.findUnique({
    where: { studentId },
    select: { status: true },
  });

  if (!existing) {
    throw new AppError("You have already submitted a project", 409);
  }

  throw conflictErrorForStatus(existing.status);
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
 * Duplicate policy: one submission row per student (unique studentId).
 * PENDING/APPROVED are locked; REJECTED must use resubmit instead.
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
      await throwCreateConflictForStudent(studentId);
    }

    throw error;
  }
}

/**
 * Update a REJECTED submission in place and return it to PENDING.
 * Concurrent-safe: updateMany only matches status REJECTED for this student.
 */
export async function resubmitSubmissionForStudent(
  studentId: string,
  input: ResubmitSubmissionInput,
): Promise<SafeSubmission> {
  const existing = await prisma.submission.findUnique({
    where: { studentId },
  });

  if (!existing) {
    throw new AppError("No submission found to resubmit", 404);
  }

  if (existing.status === "PENDING") {
    throw conflictErrorForStatus("PENDING");
  }

  if (existing.status === "APPROVED") {
    throw conflictErrorForStatus("APPROVED");
  }

  if (existing.status !== "REJECTED") {
    throw new AppError("Only rejected submissions can be resubmitted", 409);
  }

  const previousFeedback = existing.feedback ?? existing.previousFeedback;
  const resubmittedAt = new Date();

  const updated = await prisma.submission.updateMany({
    where: {
      studentId,
      status: "REJECTED",
    },
    data: {
      projectName: input.projectName,
      repoUrl: input.repoUrl,
      liveUrl: input.liveUrl,
      description: input.description,
      status: "PENDING",
      previousFeedback,
      feedback: null,
      reviewedAt: null,
      resubmittedAt,
    },
  });

  if (updated.count !== 1) {
    // Status changed concurrently (e.g. mentor action) — re-check.
    const current = await prisma.submission.findUnique({
      where: { studentId },
      select: { status: true },
    });

    if (!current) {
      throw new AppError("No submission found to resubmit", 404);
    }

    throw conflictErrorForStatus(current.status);
  }

  const submission = await prisma.submission.findUnique({
    where: { studentId },
  });

  if (!submission) {
    throw new AppError("No submission found to resubmit", 404);
  }

  return toSafeSubmission(submission);
}

/**
 * Split a mentor search query into words. Each word must match (AND);
 * within a word, project name, student name, or email may match (OR).
 */
function buildSearchWhere(q: string): Prisma.SubmissionWhereInput {
  const terms = q.split(/\s+/).filter((term) => term.length > 0);
  if (terms.length === 0) {
    return {};
  }

  const termClause = (term: string): Prisma.SubmissionWhereInput => ({
    OR: [
      { projectName: { contains: term, mode: "insensitive" } },
      { student: { name: { contains: term, mode: "insensitive" } } },
      { student: { email: { contains: term, mode: "insensitive" } } },
    ],
  });

  if (terms.length === 1) {
    return termClause(terms[0]!);
  }

  return {
    AND: terms.map((term) => termClause(term)),
  };
}

/** Mentor listing with optional status filter, search, sort, and pagination. */
export async function listSubmissionsForMentor(
  query: ListSubmissionsQuery,
): Promise<PaginatedSubmissions> {
  const where: Prisma.SubmissionWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.q ? buildSearchWhere(query.q) : {}),
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
