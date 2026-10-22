import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import app from "../src/app";
import { env } from "../src/config/env";
import { disconnectPrisma, prisma } from "../src/lib/prisma";
import { clearSubmissionRateLimit } from "../src/middlewares/submissionRateLimit";
import { seedMentorAccount } from "../src/services/seedService";
import { resetDatabase } from "./helpers";

const student = {
  name: "Ada Student",
  email: "ada.submit@example.com",
  password: "StudentPass123!",
};

const validSubmission = {
  projectName: "Portfolio Site",
  repoUrl: "https://github.com/ada/portfolio",
  liveUrl: "https://ada-portfolio.example.com",
  description: "A personal portfolio built with Next.js.",
};

async function signupStudent(
  overrides: Partial<typeof student> = {},
): Promise<{ token: string; userId: string }> {
  const payload = { ...student, ...overrides };
  const response = await request(app).post("/api/auth/signup").send(payload);

  expect(response.status).toBe(201);

  return {
    token: response.body.data.token as string,
    userId: response.body.data.user.id as string,
  };
}

describe("B4 student submissions", () => {
  beforeEach(async () => {
    clearSubmissionRateLimit();
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  it("rejects unauthenticated submission attempts", async () => {
    const response = await request(app).post("/api/submissions").send(validSubmission);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("rejects mentor users from the student submission endpoint", async () => {
    await seedMentorAccount(prisma, {
      name: "Mentor Admin",
      email: "mentor.submit@example.com",
      password: "MentorPass123!",
    });

    const login = await request(app).post("/api/auth/login").send({
      email: "mentor.submit@example.com",
      password: "MentorPass123!",
    });

    const response = await request(app)
      .post("/api/submissions")
      .set("Authorization", `Bearer ${login.body.data.token}`)
      .send(validSubmission);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  it("allows a valid student to create a PENDING submission", async () => {
    const { token, userId } = await signupStudent();

    const response = await request(app)
      .post("/api/submissions")
      .set("Authorization", `Bearer ${token}`)
      .send(validSubmission);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.submission).toMatchObject({
      projectName: validSubmission.projectName,
      repoUrl: validSubmission.repoUrl,
      liveUrl: validSubmission.liveUrl,
      description: validSubmission.description,
      status: "PENDING",
      studentId: userId,
    });
    expect(response.body.data.submission).not.toHaveProperty("passwordHash");
    expect(response.body.data).not.toHaveProperty("passwordHash");

    const stored = await prisma.submission.findUnique({ where: { studentId: userId } });
    expect(stored?.status).toBe("PENDING");
    expect(stored?.studentId).toBe(userId);
  });

  it("uses the authenticated student id and ignores client-supplied identity or status", async () => {
    const { token, userId } = await signupStudent();
    const other = await signupStudent({
      email: "other.submit@example.com",
      name: "Other Student",
    });

    const response = await request(app)
      .post("/api/submissions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        ...validSubmission,
        studentId: other.userId,
        status: "APPROVED",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Validation failed");

    const created = await request(app)
      .post("/api/submissions")
      .set("Authorization", `Bearer ${token}`)
      .send(validSubmission);

    expect(created.status).toBe(201);
    expect(created.body.data.submission.studentId).toBe(userId);
    expect(created.body.data.submission.studentId).not.toBe(other.userId);
    expect(created.body.data.submission.status).toBe("PENDING");
  });

  it("rejects invalid URLs and invalid fields", async () => {
    const { token } = await signupStudent();

    const response = await request(app)
      .post("/api/submissions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        projectName: "",
        repoUrl: "not-a-url",
        liveUrl: "ftp://example.com/live",
        description: "",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: expect.any(String) }),
      ]),
    );
    expect(JSON.stringify(response.body)).not.toMatch(/stack/i);
    expect(JSON.stringify(response.body)).not.toMatch(/prisma/i);
  });

  it("rejects whitespace-only fields and non-http(s) schemes", async () => {
    const { token } = await signupStudent();

    const whitespace = await request(app)
      .post("/api/submissions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        projectName: "   ",
        repoUrl: "https://github.com/ada/portfolio",
        liveUrl: "https://ada-portfolio.example.com",
        description: "\t\n",
      });

    expect(whitespace.status).toBe(400);

    const javascriptUrl = await request(app)
      .post("/api/submissions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        ...validSubmission,
        repoUrl: "javascript:alert(1)",
      });

    expect(javascriptUrl.status).toBe(400);
  });

  it("rejects duplicate submissions for the same student", async () => {
    const { token, userId } = await signupStudent();

    const first = await request(app)
      .post("/api/submissions")
      .set("Authorization", `Bearer ${token}`)
      .send(validSubmission);

    const second = await request(app)
      .post("/api/submissions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        ...validSubmission,
        projectName: "Another Project",
        repoUrl: "https://github.com/ada/another",
      });

    expect(first.status).toBe(201);
    expect(second.status).toBe(409);
    expect(second.body.message).toMatch(/pending mentor review/i);

    const count = await prisma.submission.count({ where: { studentId: userId } });
    expect(count).toBe(1);
  });

  it("returns 429 when the submission rate limit is exceeded", async () => {
    const { token } = await signupStudent();
    const max = env.submissionRateLimitMax;

    for (let attempt = 1; attempt <= max; attempt += 1) {
      const response = await request(app)
        .post("/api/submissions")
        .set("Authorization", `Bearer ${token}`)
        .send({
          ...validSubmission,
          projectName: `Attempt ${attempt}`,
        });

      // First create succeeds; later attempts are duplicates (409) but still count toward the limit.
      expect([201, 409]).toContain(response.status);
    }

    const limited = await request(app)
      .post("/api/submissions")
      .set("Authorization", `Bearer ${token}`)
      .send(validSubmission);

    expect(limited.status).toBe(429);
    expect(limited.body.success).toBe(false);
    expect(limited.body.message).toMatch(/too many/i);
  });

  it("does not leak internal database details on success or duplicate conflict", async () => {
    const { token } = await signupStudent();

    const created = await request(app)
      .post("/api/submissions")
      .set("Authorization", `Bearer ${token}`)
      .send(validSubmission);

    const duplicate = await request(app)
      .post("/api/submissions")
      .set("Authorization", `Bearer ${token}`)
      .send(validSubmission);

    expect(created.status).toBe(201);
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.message).toMatch(/pending mentor review/i);

    for (const body of [created.body, duplicate.body]) {
      expect(JSON.stringify(body)).not.toMatch(/passwordHash/i);
      expect(JSON.stringify(body)).not.toMatch(/prisma/i);
      expect(JSON.stringify(body)).not.toMatch(/stack/i);
      expect(JSON.stringify(body)).not.toMatch(/P2002/i);
    }
  });
});

describe("B4 rate limiter store cleanup", () => {
  it("prunes expired keys so memory stays bounded", async () => {
    const { createRateLimiter } = await import("../src/middlewares/rateLimit");
    const { AppError } = await import("../src/utils/errors");

    const limiter = createRateLimiter({
      max: 1,
      windowMs: 20,
      keyFn: (req) => String((req as { key?: string }).key ?? "default"),
    });

    const run = (key: string) =>
      new Promise<Error | undefined>((resolve) => {
        limiter.middleware({ key } as never, {} as never, (err?: unknown) => {
          resolve(err instanceof Error ? err : undefined);
        });
      });

    expect(await run("a")).toBeUndefined();
    expect(await run("b")).toBeUndefined();
    expect(limiter.size()).toBe(2);

    expect(await run("a")).toBeInstanceOf(AppError);
    expect(limiter.size()).toBe(2);

    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(await run("c")).toBeUndefined();
    expect(limiter.size()).toBe(1);
  });
});

