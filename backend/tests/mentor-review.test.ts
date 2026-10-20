import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import app from "../src/app";
import { disconnectPrisma, prisma } from "../src/lib/prisma";
import { clearSubmissionRateLimit } from "../src/middlewares/submissionRateLimit";
import { seedMentorAccount } from "../src/services/seedService";
import { resetDatabase } from "./helpers";

const mentorCreds = {
  name: "Mentor Admin",
  email: "mentor.review@example.com",
  password: "MentorPass123!",
};

async function ensureMentorToken(): Promise<string> {
  await seedMentorAccount(prisma, mentorCreds);
  const login = await request(app).post("/api/auth/login").send({
    email: mentorCreds.email,
    password: mentorCreds.password,
  });
  expect(login.status).toBe(200);
  return login.body.data.token as string;
}

async function createStudentWithSubmission(
  index: number,
): Promise<{ studentToken: string; studentId: string; submissionId: string }> {
  const email = `student${index}.review@example.com`;
  const signup = await request(app).post("/api/auth/signup").send({
    name: `Student ${index}`,
    email,
    password: "StudentPass123!",
  });
  expect(signup.status).toBe(201);

  const studentToken = signup.body.data.token as string;
  const studentId = signup.body.data.user.id as string;

  const created = await request(app)
    .post("/api/submissions")
    .set("Authorization", `Bearer ${studentToken}`)
    .send({
      projectName: `Project ${index}`,
      repoUrl: `https://github.com/student${index}/project`,
      liveUrl: `https://project${index}.example.com`,
      description: `Description for project ${index}`,
    });

  expect(created.status).toBe(201);

  return {
    studentToken,
    studentId,
    submissionId: created.body.data.submission.id as string,
  };
}

describe("B5 mentor review", () => {
  beforeEach(async () => {
    clearSubmissionRateLimit();
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  describe("authorization", () => {
    it("rejects unauthenticated access to mentor endpoints", async () => {
      const list = await request(app).get("/api/submissions");
      const stats = await request(app).get("/api/dashboard/stats");
      const status = await request(app)
        .patch("/api/submissions/some-id/status")
        .send({ status: "APPROVED" });

      expect(list.status).toBe(401);
      expect(stats.status).toBe(401);
      expect(status.status).toBe(401);
    });

    it("rejects students on listing, review actions, and statistics", async () => {
      const { studentToken, submissionId } = await createStudentWithSubmission(1);

      const list = await request(app)
        .get("/api/submissions")
        .set("Authorization", `Bearer ${studentToken}`);
      const stats = await request(app)
        .get("/api/dashboard/stats")
        .set("Authorization", `Bearer ${studentToken}`);
      const review = await request(app)
        .patch(`/api/submissions/${submissionId}/status`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ status: "APPROVED" });

      expect(list.status).toBe(403);
      expect(stats.status).toBe(403);
      expect(review.status).toBe(403);
    });

    it("allows a valid mentor to access review endpoints", async () => {
      await createStudentWithSubmission(1);
      const mentorToken = await ensureMentorToken();

      const list = await request(app)
        .get("/api/submissions")
        .set("Authorization", `Bearer ${mentorToken}`);
      const stats = await request(app)
        .get("/api/dashboard/stats")
        .set("Authorization", `Bearer ${mentorToken}`);

      expect(list.status).toBe(200);
      expect(stats.status).toBe(200);
    });
  });

  describe("listing and filters", () => {
    it("lists submissions with student summary and supports status filters", async () => {
      const first = await createStudentWithSubmission(1);
      const second = await createStudentWithSubmission(2);
      const third = await createStudentWithSubmission(3);
      const mentorToken = await ensureMentorToken();

      await request(app)
        .patch(`/api/submissions/${first.submissionId}/status`)
        .set("Authorization", `Bearer ${mentorToken}`)
        .send({ status: "APPROVED" });
      await request(app)
        .patch(`/api/submissions/${second.submissionId}/status`)
        .set("Authorization", `Bearer ${mentorToken}`)
        .send({ status: "REJECTED" });

      const all = await request(app)
        .get("/api/submissions")
        .set("Authorization", `Bearer ${mentorToken}`);
      expect(all.status).toBe(200);
      expect(all.body.data.items).toHaveLength(3);
      expect(all.body.data.items[0]).toMatchObject({
        projectName: expect.any(String),
        repoUrl: expect.any(String),
        liveUrl: expect.any(String),
        description: expect.any(String),
        status: expect.any(String),
        student: {
          id: expect.any(String),
          name: expect.any(String),
          email: expect.any(String),
          role: "STUDENT",
        },
      });
      expect(JSON.stringify(all.body)).not.toMatch(/passwordHash/i);

      const approved = await request(app)
        .get("/api/submissions")
        .query({ status: "APPROVED" })
        .set("Authorization", `Bearer ${mentorToken}`);
      expect(approved.status).toBe(200);
      expect(approved.body.data.items).toHaveLength(1);
      expect(approved.body.data.items[0].id).toBe(first.submissionId);
      expect(approved.body.data.items.every((s: { status: string }) => s.status === "APPROVED")).toBe(
        true,
      );

      const rejected = await request(app)
        .get("/api/submissions")
        .query({ status: "REJECTED" })
        .set("Authorization", `Bearer ${mentorToken}`);
      expect(rejected.status).toBe(200);
      expect(rejected.body.data.items).toHaveLength(1);
      expect(rejected.body.data.items[0].id).toBe(second.submissionId);

      const pending = await request(app)
        .get("/api/submissions")
        .query({ status: "PENDING" })
        .set("Authorization", `Bearer ${mentorToken}`);
      expect(pending.status).toBe(200);
      expect(pending.body.data.items).toHaveLength(1);
      expect(pending.body.data.items[0].id).toBe(third.submissionId);
    });

    it("paginates with correct metadata and deterministic ordering", async () => {
      for (let i = 1; i <= 5; i += 1) {
        await createStudentWithSubmission(i);
      }
      const mentorToken = await ensureMentorToken();

      const page1 = await request(app)
        .get("/api/submissions")
        .query({ page: 1, limit: 2 })
        .set("Authorization", `Bearer ${mentorToken}`);
      const page2 = await request(app)
        .get("/api/submissions")
        .query({ page: 2, limit: 2 })
        .set("Authorization", `Bearer ${mentorToken}`);

      expect(page1.status).toBe(200);
      expect(page1.body.data.pagination).toEqual({
        page: 1,
        limit: 2,
        total: 5,
        totalPages: 3,
      });
      expect(page1.body.data.items).toHaveLength(2);
      expect(page2.body.data.items).toHaveLength(2);

      const ids = [
        ...page1.body.data.items.map((s: { id: string }) => s.id),
        ...page2.body.data.items.map((s: { id: string }) => s.id),
      ];
      expect(new Set(ids).size).toBe(4);

      const again = await request(app)
        .get("/api/submissions")
        .query({ page: 1, limit: 2 })
        .set("Authorization", `Bearer ${mentorToken}`);
      expect(again.body.data.items.map((s: { id: string }) => s.id)).toEqual(
        page1.body.data.items.map((s: { id: string }) => s.id),
      );

      const createdAts = page1.body.data.items.map((s: { createdAt: string; id: string }) => ({
        createdAt: s.createdAt,
        id: s.id,
      }));
      for (let i = 1; i < createdAts.length; i += 1) {
        const prev = createdAts[i - 1];
        const curr = createdAts[i];
        const prevTime = new Date(prev.createdAt).getTime();
        const currTime = new Date(curr.createdAt).getTime();
        expect(prevTime >= currTime).toBe(true);
        if (prevTime === currTime) {
          expect(prev.id >= curr.id).toBe(true);
        }
      }
    });

    it("rejects invalid filters and pagination parameters", async () => {
      const mentorToken = await ensureMentorToken();

      const badStatus = await request(app)
        .get("/api/submissions")
        .query({ status: "DONE" })
        .set("Authorization", `Bearer ${mentorToken}`);
      const badPage = await request(app)
        .get("/api/submissions")
        .query({ page: 0 })
        .set("Authorization", `Bearer ${mentorToken}`);
      const badLimit = await request(app)
        .get("/api/submissions")
        .query({ limit: 100 })
        .set("Authorization", `Bearer ${mentorToken}`);

      expect(badStatus.status).toBe(400);
      expect(badPage.status).toBe(400);
      expect(badLimit.status).toBe(400);
    });
  });

  describe("review actions", () => {
    it("approves and rejects pending submissions", async () => {
      const a = await createStudentWithSubmission(1);
      const b = await createStudentWithSubmission(2);
      const mentorToken = await ensureMentorToken();

      const approved = await request(app)
        .patch(`/api/submissions/${a.submissionId}/status`)
        .set("Authorization", `Bearer ${mentorToken}`)
        .send({ status: "APPROVED" });
      const rejected = await request(app)
        .patch(`/api/submissions/${b.submissionId}/status`)
        .set("Authorization", `Bearer ${mentorToken}`)
        .send({ status: "REJECTED" });

      expect(approved.status).toBe(200);
      expect(approved.body.data.submission.status).toBe("APPROVED");
      expect(rejected.status).toBe(200);
      expect(rejected.body.data.submission.status).toBe("REJECTED");
    });

    it("returns 404 for a missing submission", async () => {
      const mentorToken = await ensureMentorToken();

      const response = await request(app)
        .patch("/api/submissions/missing-submission-id/status")
        .set("Authorization", `Bearer ${mentorToken}`)
        .send({ status: "APPROVED" });

      expect(response.status).toBe(404);
    });

    it("does not silently overwrite an already-reviewed submission", async () => {
      const { submissionId } = await createStudentWithSubmission(1);
      const mentorToken = await ensureMentorToken();

      const first = await request(app)
        .patch(`/api/submissions/${submissionId}/status`)
        .set("Authorization", `Bearer ${mentorToken}`)
        .send({ status: "APPROVED" });
      const second = await request(app)
        .patch(`/api/submissions/${submissionId}/status`)
        .set("Authorization", `Bearer ${mentorToken}`)
        .send({ status: "REJECTED" });

      expect(first.status).toBe(200);
      expect(second.status).toBe(409);
      expect(second.body.message).toMatch(/already been reviewed/i);

      const stored = await prisma.submission.findUnique({ where: { id: submissionId } });
      expect(stored?.status).toBe("APPROVED");
    });

    it("handles concurrent conflicting decisions without silent overwrite", async () => {
      const { submissionId } = await createStudentWithSubmission(1);
      const mentorToken = await ensureMentorToken();

      const [first, second] = await Promise.all([
        request(app)
          .patch(`/api/submissions/${submissionId}/status`)
          .set("Authorization", `Bearer ${mentorToken}`)
          .send({ status: "APPROVED" }),
        request(app)
          .patch(`/api/submissions/${submissionId}/status`)
          .set("Authorization", `Bearer ${mentorToken}`)
          .send({ status: "REJECTED" }),
      ]);

      const statuses = [first.status, second.status].sort();
      expect(statuses).toEqual([200, 409]);

      const stored = await prisma.submission.findUnique({ where: { id: submissionId } });
      expect(["APPROVED", "REJECTED"]).toContain(stored?.status);
      expect(stored?.status).not.toBe("PENDING");
    });

    it("prevents students from setting status through submission creation", async () => {
      const signup = await request(app).post("/api/auth/signup").send({
        name: "Status Attacker",
        email: "status.attacker@example.com",
        password: "StudentPass123!",
      });
      const token = signup.body.data.token as string;

      const response = await request(app)
        .post("/api/submissions")
        .set("Authorization", `Bearer ${token}`)
        .send({
          projectName: "Hacked",
          repoUrl: "https://github.com/x/y",
          liveUrl: "https://x.example.com",
          description: "Trying to self-approve",
          status: "APPROVED",
        });

      expect(response.status).toBe(400);

      const ok = await request(app)
        .post("/api/submissions")
        .set("Authorization", `Bearer ${token}`)
        .send({
          projectName: "Valid",
          repoUrl: "https://github.com/x/y",
          liveUrl: "https://x.example.com",
          description: "Normal create",
        });

      expect(ok.status).toBe(201);
      expect(ok.body.data.submission.status).toBe("PENDING");
    });
  });

  describe("statistics", () => {
    it("returns pending and approved counts that match the database", async () => {
      const a = await createStudentWithSubmission(1);
      const b = await createStudentWithSubmission(2);
      await createStudentWithSubmission(3);
      const mentorToken = await ensureMentorToken();

      await request(app)
        .patch(`/api/submissions/${a.submissionId}/status`)
        .set("Authorization", `Bearer ${mentorToken}`)
        .send({ status: "APPROVED" });
      await request(app)
        .patch(`/api/submissions/${b.submissionId}/status`)
        .set("Authorization", `Bearer ${mentorToken}`)
        .send({ status: "REJECTED" });

      const response = await request(app)
        .get("/api/dashboard/stats")
        .set("Authorization", `Bearer ${mentorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.stats).toEqual({
        totalPending: 1,
        totalApproved: 1,
        totalRejected: 1,
        totalSubmissions: 3,
      });

      const pending = await prisma.submission.count({ where: { status: "PENDING" } });
      const approved = await prisma.submission.count({ where: { status: "APPROVED" } });
      expect(response.body.data.stats.totalPending).toBe(pending);
      expect(response.body.data.stats.totalApproved).toBe(approved);
    });

    it("keeps statistics protected by mentor authorization", async () => {
      const { studentToken } = await createStudentWithSubmission(1);
      const denied = await request(app)
        .get("/api/dashboard/stats")
        .set("Authorization", `Bearer ${studentToken}`);
      expect(denied.status).toBe(403);
    });
  });
});
