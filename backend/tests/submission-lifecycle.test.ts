import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import app from "../src/app";
import { disconnectPrisma, prisma } from "../src/lib/prisma";
import { clearSubmissionRateLimit } from "../src/middlewares/submissionRateLimit";
import { seedMentorAccount } from "../src/services/seedService";
import { resetDatabase } from "./helpers";

const mentorCreds = {
  name: "Lifecycle Mentor",
  email: "mentor.lifecycle@example.com",
  password: "MentorPass123!",
};

const validSubmission = {
  projectName: "Lifecycle Project",
  repoUrl: "https://github.com/ada/lifecycle",
  liveUrl: "https://lifecycle.example.com",
  description: "Initial project description for lifecycle tests.",
};

async function signupStudent(email: string) {
  const response = await request(app).post("/api/auth/signup").send({
    name: "Lifecycle Student",
    email,
    password: "StudentPass123!",
  });
  expect(response.status).toBe(201);
  return {
    token: response.body.data.token as string,
    userId: response.body.data.user.id as string,
  };
}

async function mentorToken() {
  await seedMentorAccount(prisma, mentorCreds);
  const login = await request(app).post("/api/auth/login").send({
    email: mentorCreds.email,
    password: mentorCreds.password,
  });
  expect(login.status).toBe(200);
  return login.body.data.token as string;
}

describe("Submission lifecycle", () => {
  beforeEach(async () => {
    clearSubmissionRateLimit();
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  it("locks PENDING submissions against create/resubmit and allows REJECTED → PENDING resubmit without duplicates", async () => {
    const student = await signupStudent("ada.lifecycle@example.com");
    const mentor = await mentorToken();

    const created = await request(app)
      .post("/api/submissions")
      .set("Authorization", `Bearer ${student.token}`)
      .send(validSubmission);
    expect(created.status).toBe(201);
    expect(created.body.data.submission.status).toBe("PENDING");
    const submissionId = created.body.data.submission.id as string;

    const pendingCreate = await request(app)
      .post("/api/submissions")
      .set("Authorization", `Bearer ${student.token}`)
      .send({ ...validSubmission, projectName: "Another" });
    expect(pendingCreate.status).toBe(409);
    expect(pendingCreate.body.message).toMatch(/pending mentor review/i);

    const pendingResubmit = await request(app)
      .patch("/api/submissions/me")
      .set("Authorization", `Bearer ${student.token}`)
      .send({ ...validSubmission, projectName: "Edited While Pending" });
    expect(pendingResubmit.status).toBe(409);
    expect(pendingResubmit.body.message).toMatch(/pending mentor review/i);

    const rejected = await request(app)
      .patch(`/api/submissions/${submissionId}/status`)
      .set("Authorization", `Bearer ${mentor}`)
      .send({ status: "REJECTED", feedback: "Please fix the live demo link." });
    expect(rejected.status).toBe(200);
    expect(rejected.body.data.submission.status).toBe("REJECTED");

    const resubmitPayload = {
      projectName: "Lifecycle Project v2",
      repoUrl: "https://github.com/ada/lifecycle-v2",
      liveUrl: "https://lifecycle-v2.example.com",
      description: "Updated after mentor feedback.",
    };

    const resubmitted = await request(app)
      .patch("/api/submissions/me")
      .set("Authorization", `Bearer ${student.token}`)
      .send(resubmitPayload);

    expect(resubmitted.status).toBe(200);
    expect(resubmitted.body.data.submission).toMatchObject({
      id: submissionId,
      status: "PENDING",
      ...resubmitPayload,
      feedback: null,
      previousFeedback: "Please fix the live demo link.",
    });
    expect(resubmitted.body.data.submission.resubmittedAt).toEqual(expect.any(String));
    expect(resubmitted.body.data.submission.reviewedAt).toBeNull();

    const count = await prisma.submission.count({ where: { studentId: student.userId } });
    expect(count).toBe(1);

    const stored = await prisma.submission.findUnique({ where: { id: submissionId } });
    expect(stored?.status).toBe("PENDING");
    expect(stored?.previousFeedback).toBe("Please fix the live demo link.");
    expect(stored?.projectName).toBe("Lifecycle Project v2");
  });

  it("locks APPROVED submissions and blocks student status manipulation", async () => {
    const student = await signupStudent("bob.lifecycle@example.com");
    const mentor = await mentorToken();

    const created = await request(app)
      .post("/api/submissions")
      .set("Authorization", `Bearer ${student.token}`)
      .send(validSubmission);
    const submissionId = created.body.data.submission.id as string;

    const approved = await request(app)
      .patch(`/api/submissions/${submissionId}/status`)
      .set("Authorization", `Bearer ${mentor}`)
      .send({ status: "APPROVED", feedback: "Great work." });
    expect(approved.status).toBe(200);

    const createAgain = await request(app)
      .post("/api/submissions")
      .set("Authorization", `Bearer ${student.token}`)
      .send(validSubmission);
    expect(createAgain.status).toBe(409);
    expect(createAgain.body.message).toMatch(/approved and is locked/i);

    const resubmit = await request(app)
      .patch("/api/submissions/me")
      .set("Authorization", `Bearer ${student.token}`)
      .send({ ...validSubmission, projectName: "Should Fail" });
    expect(resubmit.status).toBe(409);
    expect(resubmit.body.message).toMatch(/approved and is locked/i);

    const studentStatus = await request(app)
      .patch(`/api/submissions/${submissionId}/status`)
      .set("Authorization", `Bearer ${student.token}`)
      .send({ status: "REJECTED" });
    expect(studentStatus.status).toBe(403);

    const count = await prisma.submission.count({ where: { studentId: student.userId } });
    expect(count).toBe(1);
  });

  it("keeps submissions isolated between students and rejects unauthorized resubmits", async () => {
    const ada = await signupStudent("ada.iso@example.com");
    const bob = await signupStudent("bob.iso@example.com");
    const mentor = await mentorToken();

    const adaCreated = await request(app)
      .post("/api/submissions")
      .set("Authorization", `Bearer ${ada.token}`)
      .send(validSubmission);
    expect(adaCreated.status).toBe(201);

    await request(app)
      .patch(`/api/submissions/${adaCreated.body.data.submission.id}/status`)
      .set("Authorization", `Bearer ${mentor}`)
      .send({ status: "REJECTED", feedback: "Needs work." });

    const bobResubmit = await request(app)
      .patch("/api/submissions/me")
      .set("Authorization", `Bearer ${bob.token}`)
      .send(validSubmission);
    expect(bobResubmit.status).toBe(404);

    const unauth = await request(app).patch("/api/submissions/me").send(validSubmission);
    expect(unauth.status).toBe(401);

    const mentorResubmit = await request(app)
      .patch("/api/submissions/me")
      .set("Authorization", `Bearer ${mentor}`)
      .send(validSubmission);
    expect(mentorResubmit.status).toBe(403);
  });

  it("rejects invalid resubmit payloads and status fields", async () => {
    const student = await signupStudent("cara.lifecycle@example.com");
    const mentor = await mentorToken();

    const created = await request(app)
      .post("/api/submissions")
      .set("Authorization", `Bearer ${student.token}`)
      .send(validSubmission);

    await request(app)
      .patch(`/api/submissions/${created.body.data.submission.id}/status`)
      .set("Authorization", `Bearer ${mentor}`)
      .send({ status: "REJECTED", feedback: "Fix description." });

    const invalid = await request(app)
      .patch("/api/submissions/me")
      .set("Authorization", `Bearer ${student.token}`)
      .send({
        projectName: "",
        repoUrl: "not-a-url",
        liveUrl: "ftp://bad.example.com",
        description: "",
        status: "APPROVED",
      });

    expect(invalid.status).toBe(400);
    expect(invalid.body.success).toBe(false);
  });
});
