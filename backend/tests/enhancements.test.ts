import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import app from "../src/app";
import { disconnectPrisma, prisma } from "../src/lib/prisma";
import { clearSubmissionRateLimit } from "../src/middlewares/submissionRateLimit";
import { seedMentorAccount } from "../src/services/seedService";
import { resetDatabase } from "./helpers";

async function signupStudent(name: string, email: string) {
  const response = await request(app).post("/api/auth/signup").send({
    name,
    email,
    password: "StudentPass123!",
  });
  expect(response.status).toBe(201);
  return {
    token: response.body.data.token as string,
    userId: response.body.data.user.id as string,
    createdAt: response.body.data.user.createdAt as string,
  };
}

async function mentorToken(): Promise<string> {
  await seedMentorAccount(prisma, {
    name: "Mentor Admin",
    email: "mentor.enh@example.com",
    password: "MentorPass123!",
  });
  const login = await request(app).post("/api/auth/login").send({
    email: "mentor.enh@example.com",
    password: "MentorPass123!",
  });
  expect(login.status).toBe(200);
  return login.body.data.token as string;
}

async function createSubmission(
  token: string,
  overrides: Partial<{
    projectName: string;
    repoUrl: string;
    liveUrl: string;
    description: string;
  }> = {},
) {
  const response = await request(app)
    .post("/api/submissions")
    .set("Authorization", `Bearer ${token}`)
    .send({
      projectName: overrides.projectName ?? "Alpha Project",
      repoUrl: overrides.repoUrl ?? "https://github.com/a/alpha",
      liveUrl: overrides.liveUrl ?? "https://alpha.example.com",
      description: overrides.description ?? "Alpha description",
    });
  expect(response.status).toBe(201);
  return response.body.data.submission;
}

describe("Enhancements: feedback, search/sort, profile, timeline fields", () => {
  beforeEach(async () => {
    clearSubmissionRateLimit();
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  it("allows mentor feedback on approve and exposes reviewedAt + feedback to the student", async () => {
    const student = await signupStudent("Ada", "ada.enh@example.com");
    const submission = await createSubmission(student.token);
    const mToken = await mentorToken();

    const review = await request(app)
      .patch(`/api/submissions/${submission.id}/status`)
      .set("Authorization", `Bearer ${mToken}`)
      .send({ status: "APPROVED", feedback: "  Great work overall.  " });

    expect(review.status).toBe(200);
    expect(review.body.data.submission.status).toBe("APPROVED");
    expect(review.body.data.submission.feedback).toBe("Great work overall.");
    expect(review.body.data.submission.reviewedAt).toBeTruthy();

    const mine = await request(app)
      .get("/api/submissions/me")
      .set("Authorization", `Bearer ${student.token}`);

    expect(mine.status).toBe(200);
    expect(mine.body.data.submission.feedback).toBe("Great work overall.");
    expect(mine.body.data.submission.reviewedAt).toBeTruthy();
    expect(mine.body.data.submission.status).toBe("APPROVED");
  });

  it("stores empty feedback as null and still sets reviewedAt", async () => {
    const student = await signupStudent("Bob", "bob.enh@example.com");
    const submission = await createSubmission(student.token, {
      projectName: "Bob Project",
      repoUrl: "https://github.com/b/bob",
      liveUrl: "https://bob.example.com",
    });
    const mToken = await mentorToken();

    const review = await request(app)
      .patch(`/api/submissions/${submission.id}/status`)
      .set("Authorization", `Bearer ${mToken}`)
      .send({ status: "REJECTED", feedback: "   " });

    expect(review.status).toBe(200);
    expect(review.body.data.submission.status).toBe("REJECTED");
    expect(review.body.data.submission.feedback).toBeNull();
    expect(review.body.data.submission.reviewedAt).toBeTruthy();
  });

  it("rejects oversized feedback and students cannot review", async () => {
    const student = await signupStudent("Cara", "cara.enh@example.com");
    const submission = await createSubmission(student.token, {
      projectName: "Cara Project",
      repoUrl: "https://github.com/c/cara",
      liveUrl: "https://cara.example.com",
    });
    const mToken = await mentorToken();

    const tooLong = await request(app)
      .patch(`/api/submissions/${submission.id}/status`)
      .set("Authorization", `Bearer ${mToken}`)
      .send({ status: "APPROVED", feedback: "x".repeat(2001) });

    expect(tooLong.status).toBe(400);

    const studentReview = await request(app)
      .patch(`/api/submissions/${submission.id}/status`)
      .set("Authorization", `Bearer ${student.token}`)
      .send({ status: "APPROVED", feedback: "Nope" });

    expect(studentReview.status).toBe(403);

    const pending = await request(app)
      .get("/api/submissions/me")
      .set("Authorization", `Bearer ${student.token}`);

    expect(pending.body.data.submission.status).toBe("PENDING");
    expect(pending.body.data.submission.reviewedAt).toBeNull();
    expect(pending.body.data.submission.feedback).toBeNull();
  });

  it("keeps 409 on repeated review after feedback was saved", async () => {
    const student = await signupStudent("Dan", "dan.enh@example.com");
    const submission = await createSubmission(student.token, {
      projectName: "Dan Project",
      repoUrl: "https://github.com/d/dan",
      liveUrl: "https://dan.example.com",
    });
    const mToken = await mentorToken();

    const first = await request(app)
      .patch(`/api/submissions/${submission.id}/status`)
      .set("Authorization", `Bearer ${mToken}`)
      .send({ status: "APPROVED", feedback: "Ship it" });

    const second = await request(app)
      .patch(`/api/submissions/${submission.id}/status`)
      .set("Authorization", `Bearer ${mToken}`)
      .send({ status: "REJECTED", feedback: "Changed mind" });

    expect(first.status).toBe(200);
    expect(second.status).toBe(409);

    const stored = await prisma.submission.findUnique({ where: { id: submission.id } });
    expect(stored?.status).toBe("APPROVED");
    expect(stored?.feedback).toBe("Ship it");
  });

  it("searches by project name and student email on the server", async () => {
    const ada = await signupStudent("Ada Search", "ada.search@example.com");
    const bob = await signupStudent("Bob Search", "bob.search@example.com");
    await createSubmission(ada.token, {
      projectName: "Neon Portfolio",
      repoUrl: "https://github.com/a/neon",
      liveUrl: "https://neon.example.com",
    });
    await createSubmission(bob.token, {
      projectName: "Blaze App",
      repoUrl: "https://github.com/b/blaze",
      liveUrl: "https://blaze.example.com",
    });
    const mToken = await mentorToken();

    const byName = await request(app)
      .get("/api/submissions")
      .query({ q: "neon" })
      .set("Authorization", `Bearer ${mToken}`);

    expect(byName.status).toBe(200);
    expect(byName.body.data.items).toHaveLength(1);
    expect(byName.body.data.items[0].projectName).toBe("Neon Portfolio");

    const byEmail = await request(app)
      .get("/api/submissions")
      .query({ q: "bob.search@" })
      .set("Authorization", `Bearer ${mToken}`);

    expect(byEmail.status).toBe(200);
    expect(byEmail.body.data.items).toHaveLength(1);
    expect(byEmail.body.data.items[0].student.email).toBe("bob.search@example.com");
  });

  it("sorts by createdAt with status filter and pagination", async () => {
    const a = await signupStudent("A", "a.sort@example.com");
    const b = await signupStudent("B", "b.sort@example.com");
    const c = await signupStudent("C", "c.sort@example.com");
    const first = await createSubmission(a.token, {
      projectName: "First",
      repoUrl: "https://github.com/a/1",
      liveUrl: "https://1.example.com",
    });
    await new Promise((r) => setTimeout(r, 20));
    const second = await createSubmission(b.token, {
      projectName: "Second",
      repoUrl: "https://github.com/b/2",
      liveUrl: "https://2.example.com",
    });
    await new Promise((r) => setTimeout(r, 20));
    const third = await createSubmission(c.token, {
      projectName: "Third",
      repoUrl: "https://github.com/c/3",
      liveUrl: "https://3.example.com",
    });

    const mToken = await mentorToken();
    await request(app)
      .patch(`/api/submissions/${first.id}/status`)
      .set("Authorization", `Bearer ${mToken}`)
      .send({ status: "APPROVED" });
    await request(app)
      .patch(`/api/submissions/${second.id}/status`)
      .set("Authorization", `Bearer ${mToken}`)
      .send({ status: "APPROVED" });

    const asc = await request(app)
      .get("/api/submissions")
      .query({ status: "APPROVED", sortBy: "createdAt", sortOrder: "asc", limit: 10 })
      .set("Authorization", `Bearer ${mToken}`);

    expect(asc.status).toBe(200);
    expect(asc.body.data.items.map((i: { id: string }) => i.id)).toEqual([
      first.id,
      second.id,
    ]);

    const page = await request(app)
      .get("/api/submissions")
      .query({ sortOrder: "desc", page: 1, limit: 2 })
      .set("Authorization", `Bearer ${mToken}`);

    expect(page.status).toBe(200);
    expect(page.body.data.pagination).toMatchObject({ page: 1, limit: 2, total: 3, totalPages: 2 });
    expect(page.body.data.items).toHaveLength(2);
    expect(page.body.data.items[0].id).toBe(third.id);
  });

  it("returns profile createdAt on /api/auth/me for the authenticated user only", async () => {
    const student = await signupStudent("Eve", "eve.profile@example.com");
    expect(student.createdAt).toBeTruthy();

    const me = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${student.token}`);

    expect(me.status).toBe(200);
    expect(me.body.data.user).toMatchObject({
      id: student.userId,
      name: "Eve",
      email: "eve.profile@example.com",
      role: "STUDENT",
    });
    expect(me.body.data.user.createdAt).toBeTruthy();
    expect(me.body.data.user).not.toHaveProperty("passwordHash");

    const unauth = await request(app).get("/api/auth/me");
    expect(unauth.status).toBe(401);
  });
});
