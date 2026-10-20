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
  };
}

async function mentorToken(): Promise<string> {
  await seedMentorAccount(prisma, {
    name: "Queue Mentor",
    email: "mentor.queue@example.com",
    password: "MentorPass123!",
  });
  const login = await request(app).post("/api/auth/login").send({
    email: "mentor.queue@example.com",
    password: "MentorPass123!",
  });
  expect(login.status).toBe(200);
  return login.body.data.token as string;
}

async function createSubmission(
  token: string,
  projectName: string,
  slug: string,
) {
  const response = await request(app)
    .post("/api/submissions")
    .set("Authorization", `Bearer ${token}`)
    .send({
      projectName,
      repoUrl: `https://github.com/q/${slug}`,
      liveUrl: `https://${slug}.example.com`,
      description: `${projectName} description`,
    });
  expect(response.status).toBe(201);
  return response.body.data.submission as { id: string; status: string; createdAt: string };
}

describe("Smart mentor review queue", () => {
  beforeEach(async () => {
    clearSubmissionRateLimit();
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  it("filters PENDING-only and defaults oldest-first when requested", async () => {
    const a = await signupStudent("Queue A", "a.queue@example.com");
    const b = await signupStudent("Queue B", "b.queue@example.com");
    const c = await signupStudent("Queue C", "c.queue@example.com");

    const first = await createSubmission(a.token, "Oldest Pending", "oldest");
    await new Promise((r) => setTimeout(r, 25));
    const second = await createSubmission(b.token, "Middle Pending", "middle");
    await new Promise((r) => setTimeout(r, 25));
    const third = await createSubmission(c.token, "Newest Pending", "newest");

    const mToken = await mentorToken();
    await request(app)
      .patch(`/api/submissions/${second.id}/status`)
      .set("Authorization", `Bearer ${mToken}`)
      .send({ status: "APPROVED" });

    const pendingAsc = await request(app)
      .get("/api/submissions")
      .query({ status: "PENDING", sortBy: "createdAt", sortOrder: "asc" })
      .set("Authorization", `Bearer ${mToken}`);

    expect(pendingAsc.status).toBe(200);
    expect(pendingAsc.body.data.items).toHaveLength(2);
    expect(pendingAsc.body.data.items.every((i: { status: string }) => i.status === "PENDING")).toBe(
      true,
    );
    expect(pendingAsc.body.data.items.map((i: { id: string }) => i.id)).toEqual([
      first.id,
      third.id,
    ]);

    const pendingDesc = await request(app)
      .get("/api/submissions")
      .query({ status: "PENDING", sortOrder: "desc" })
      .set("Authorization", `Bearer ${mToken}`);

    expect(pendingDesc.status).toBe(200);
    expect(pendingDesc.body.data.items.map((i: { id: string }) => i.id)).toEqual([
      third.id,
      first.id,
    ]);
  });

  it("keeps pagination stable with secondary id ordering", async () => {
    const tokens = [];
    for (let i = 0; i < 3; i += 1) {
      tokens.push(await signupStudent(`P${i}`, `p${i}.queue@example.com`));
    }

    const created = [];
    for (let i = 0; i < 3; i += 1) {
      created.push(await createSubmission(tokens[i].token, `Proj ${i}`, `p${i}`));
      await new Promise((r) => setTimeout(r, 15));
    }

    const mToken = await mentorToken();
    const page1 = await request(app)
      .get("/api/submissions")
      .query({ status: "PENDING", sortOrder: "asc", page: 1, limit: 2 })
      .set("Authorization", `Bearer ${mToken}`);
    const page2 = await request(app)
      .get("/api/submissions")
      .query({ status: "PENDING", sortOrder: "asc", page: 2, limit: 2 })
      .set("Authorization", `Bearer ${mToken}`);

    expect(page1.status).toBe(200);
    expect(page2.status).toBe(200);
    expect(page1.body.data.pagination).toMatchObject({
      page: 1,
      limit: 2,
      total: 3,
      totalPages: 2,
    });
    expect(page1.body.data.items).toHaveLength(2);
    expect(page2.body.data.items).toHaveLength(1);

    const allIds = [
      ...page1.body.data.items.map((i: { id: string }) => i.id),
      ...page2.body.data.items.map((i: { id: string }) => i.id),
    ];
    expect(allIds).toEqual(created.map((c) => c.id));
  });

  it("rejects invalid sort parameters and non-mentor access", async () => {
    const student = await signupStudent("Student Q", "student.queue@example.com");
    await createSubmission(student.token, "Student Project", "student-q");
    const mToken = await mentorToken();

    const badSortBy = await request(app)
      .get("/api/submissions")
      .query({ sortBy: "projectName" })
      .set("Authorization", `Bearer ${mToken}`);
    expect(badSortBy.status).toBe(400);

    const badSortOrder = await request(app)
      .get("/api/submissions")
      .query({ sortOrder: "sideways" })
      .set("Authorization", `Bearer ${mToken}`);
    expect(badSortOrder.status).toBe(400);

    const studentDenied = await request(app)
      .get("/api/submissions")
      .query({ status: "PENDING" })
      .set("Authorization", `Bearer ${student.token}`);
    expect(studentDenied.status).toBe(403);
  });

  it("removes reviewed submissions from the pending queue", async () => {
    const student = await signupStudent("Review Me", "review.queue@example.com");
    const submission = await createSubmission(student.token, "Needs Review", "needs");
    const mToken = await mentorToken();

    const before = await request(app)
      .get("/api/submissions")
      .query({ status: "PENDING" })
      .set("Authorization", `Bearer ${mToken}`);
    expect(before.body.data.items.some((i: { id: string }) => i.id === submission.id)).toBe(
      true,
    );

    const review = await request(app)
      .patch(`/api/submissions/${submission.id}/status`)
      .set("Authorization", `Bearer ${mToken}`)
      .send({ status: "REJECTED", feedback: "Please revise" });
    expect(review.status).toBe(200);

    const after = await request(app)
      .get("/api/submissions")
      .query({ status: "PENDING", sortOrder: "asc" })
      .set("Authorization", `Bearer ${mToken}`);
    expect(after.body.data.items.some((i: { id: string }) => i.id === submission.id)).toBe(
      false,
    );

    const rejected = await request(app)
      .get("/api/submissions")
      .query({ status: "REJECTED" })
      .set("Authorization", `Bearer ${mToken}`);
    expect(rejected.body.data.items.some((i: { id: string }) => i.id === submission.id)).toBe(
      true,
    );
  });
});
