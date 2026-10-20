import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import app from "../src/app";
import { disconnectPrisma, prisma } from "../src/lib/prisma";
import { clearSubmissionRateLimit } from "../src/middlewares/submissionRateLimit";
import { seedMentorAccount } from "../src/services/seedService";
import { resetDatabase } from "./helpers";

const studentA = {
  name: "Ada Student",
  email: "ada.me@example.com",
  password: "StudentPass123!",
};

const studentB = {
  name: "Bob Student",
  email: "bob.me@example.com",
  password: "StudentPass123!",
};

const validSubmission = {
  projectName: "Portfolio Site",
  repoUrl: "https://github.com/ada/portfolio",
  liveUrl: "https://ada-portfolio.example.com",
  description: "A personal portfolio built with Next.js.",
};

async function signupStudent(
  payload: typeof studentA,
): Promise<{ token: string; userId: string }> {
  const response = await request(app).post("/api/auth/signup").send(payload);

  expect(response.status).toBe(201);

  return {
    token: response.body.data.token as string,
    userId: response.body.data.user.id as string,
  };
}

describe("GET /api/submissions/me", () => {
  beforeEach(async () => {
    clearSubmissionRateLimit();
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  it("returns the authenticated student's own submission", async () => {
    const { token, userId } = await signupStudent(studentA);

    const created = await request(app)
      .post("/api/submissions")
      .set("Authorization", `Bearer ${token}`)
      .send(validSubmission);

    expect(created.status).toBe(201);

    const response = await request(app)
      .get("/api/submissions/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.submission).toMatchObject({
      id: created.body.data.submission.id,
      projectName: validSubmission.projectName,
      repoUrl: validSubmission.repoUrl,
      liveUrl: validSubmission.liveUrl,
      description: validSubmission.description,
      status: "PENDING",
      studentId: userId,
    });
    expect(response.body.data.submission.createdAt).toBeTruthy();
    expect(response.body.data.submission.updatedAt).toBeTruthy();
    expect(JSON.stringify(response.body)).not.toMatch(/passwordHash/i);
  });

  it("returns submission null when the student has not submitted", async () => {
    const { token } = await signupStudent(studentA);

    const response = await request(app)
      .get("/api/submissions/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual({ submission: null });
  });

  it("rejects unauthenticated requests", async () => {
    const response = await request(app).get("/api/submissions/me");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("rejects mentor users from the student-only endpoint", async () => {
    await seedMentorAccount(prisma, {
      name: "Mentor Admin",
      email: "mentor.me@example.com",
      password: "MentorPass123!",
    });

    const login = await request(app).post("/api/auth/login").send({
      email: "mentor.me@example.com",
      password: "MentorPass123!",
    });

    expect(login.status).toBe(200);

    const response = await request(app)
      .get("/api/submissions/me")
      .set("Authorization", `Bearer ${login.body.data.token}`);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  it("does not return another student's submission", async () => {
    const ada = await signupStudent(studentA);
    const bob = await signupStudent(studentB);

    const adaCreate = await request(app)
      .post("/api/submissions")
      .set("Authorization", `Bearer ${ada.token}`)
      .send(validSubmission);

    expect(adaCreate.status).toBe(201);

    const bobCreate = await request(app)
      .post("/api/submissions")
      .set("Authorization", `Bearer ${bob.token}`)
      .send({
        projectName: "Bob App",
        repoUrl: "https://github.com/bob/app",
        liveUrl: "https://bob.example.com",
        description: "Bob's project",
      });

    expect(bobCreate.status).toBe(201);

    const adaView = await request(app)
      .get("/api/submissions/me")
      .set("Authorization", `Bearer ${ada.token}`);

    const bobView = await request(app)
      .get("/api/submissions/me")
      .set("Authorization", `Bearer ${bob.token}`);

    expect(adaView.status).toBe(200);
    expect(bobView.status).toBe(200);
    expect(adaView.body.data.submission.studentId).toBe(ada.userId);
    expect(adaView.body.data.submission.projectName).toBe(validSubmission.projectName);
    expect(bobView.body.data.submission.studentId).toBe(bob.userId);
    expect(bobView.body.data.submission.projectName).toBe("Bob App");
    expect(adaView.body.data.submission.id).not.toBe(bobView.body.data.submission.id);
  });

  it("preserves create and duplicate-prevention behavior", async () => {
    const { token, userId } = await signupStudent(studentA);

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
      });

    const mine = await request(app)
      .get("/api/submissions/me")
      .set("Authorization", `Bearer ${token}`);

    expect(first.status).toBe(201);
    expect(second.status).toBe(409);
    expect(mine.status).toBe(200);
    expect(mine.body.data.submission.studentId).toBe(userId);
    expect(mine.body.data.submission.projectName).toBe(validSubmission.projectName);

    const count = await prisma.submission.count({ where: { studentId: userId } });
    expect(count).toBe(1);
  });
});
