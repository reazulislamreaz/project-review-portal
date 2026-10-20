import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import app from "../src/app";
import { env } from "../src/config/env";
import { prisma, disconnectPrisma } from "../src/lib/prisma";
import { seedMentorAccount } from "../src/services/seedService";
import { resetDatabase } from "./helpers";

const student = {
  name: "Ada Student",
  email: "ada@example.com",
  password: "StudentPass123!",
};

describe("B3 authentication", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  it("signs up a student with valid input", async () => {
    const response = await request(app).post("/api/auth/signup").send(student);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user).toMatchObject({
      name: student.name,
      email: "ada@example.com",
      role: "STUDENT",
    });
    expect(response.body.data.user).not.toHaveProperty("passwordHash");
    expect(typeof response.body.data.token).toBe("string");

    const stored = await prisma.user.findUnique({ where: { email: "ada@example.com" } });
    expect(stored).not.toBeNull();
    expect(stored?.passwordHash).not.toBe(student.password);
    expect(stored?.passwordHash.startsWith("$2")).toBe(true);
  });

  it("rejects invalid signup input", async () => {
    const response = await request(app).post("/api/auth/signup").send({
      name: "",
      email: "not-an-email",
      password: "short",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("does not accept a client-supplied MENTOR role on signup", async () => {
    const response = await request(app)
      .post("/api/auth/signup")
      .send({ ...student, role: "MENTOR" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);

    const stored = await prisma.user.findUnique({ where: { email: "ada@example.com" } });
    expect(stored).toBeNull();
  });

  it("rejects duplicate email registration", async () => {
    await request(app).post("/api/auth/signup").send(student);

    const response = await request(app)
      .post("/api/auth/signup")
      .send({ ...student, email: "Ada@Example.com", name: "Other Name" });

    expect(response.status).toBe(409);
    expect(response.body.message).toMatch(/already registered/i);
  });

  it("logs in with valid credentials", async () => {
    await request(app).post("/api/auth/signup").send(student);

    const response = await request(app).post("/api/auth/login").send({
      email: "ADA@example.com",
      password: student.password,
    });

    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe("ada@example.com");
    expect(typeof response.body.data.token).toBe("string");
    expect(response.body.data.user).not.toHaveProperty("passwordHash");
  });

  it("fails login with incorrect credentials using a generic error", async () => {
    await request(app).post("/api/auth/signup").send(student);

    const wrongPassword = await request(app).post("/api/auth/login").send({
      email: student.email,
      password: "WrongPassword1!",
    });

    const unknownUser = await request(app).post("/api/auth/login").send({
      email: "missing@example.com",
      password: student.password,
    });

    expect(wrongPassword.status).toBe(401);
    expect(unknownUser.status).toBe(401);
    expect(wrongPassword.body.message).toBe("Invalid email or password");
    expect(unknownUser.body.message).toBe("Invalid email or password");
  });

  it("rejects missing, invalid, and expired JWTs on protected routes", async () => {
    const signup = await request(app).post("/api/auth/signup").send(student);
    const userId = signup.body.data.user.id as string;

    const missing = await request(app).get("/api/auth/me");
    expect(missing.status).toBe(401);

    const malformed = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer not-a-jwt");
    expect(malformed.status).toBe(401);

    const wrongSecret = jwt.sign({ userId, role: "STUDENT" }, "different-secret-not-used-by-app!!", {
      algorithm: "HS256",
      expiresIn: "1h",
    });
    const badSignature = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${wrongSecret}`);
    expect(badSignature.status).toBe(401);

    const emptyUserId = jwt.sign({ userId: "", role: "STUDENT" }, env.jwtSecret, {
      algorithm: "HS256",
      expiresIn: "1h",
    });
    const emptyClaim = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${emptyUserId}`);
    expect(emptyClaim.status).toBe(401);

    const lowercaseBearer = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `bearer ${signup.body.data.token}`);
    expect(lowercaseBearer.status).toBe(200);

    const expiredToken = jwt.sign({ userId, role: "STUDENT" }, env.jwtSecret, {
      algorithm: "HS256",
      expiresIn: -10,
    });
    const expired = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${expiredToken}`);
    expect(expired.status).toBe(401);
  });

  it("guards test database isolation configuration", async () => {
    const { assertSafeTestDatabaseUrl } = await import("./dbGuard");

    expect(() => assertSafeTestDatabaseUrl(process.env.DATABASE_URL)).not.toThrow();
    expect(() =>
      assertSafeTestDatabaseUrl(
        "postgresql://postgres:postgres@localhost:5432/project_submission?schema=public",
      ),
    ).toThrow(/_test/);
  });

  it("returns the authenticated user's safe profile from /api/auth/me", async () => {
    const signup = await request(app).post("/api/auth/signup").send(student);
    const token = signup.body.data.token as string;

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.user).toEqual(
      expect.objectContaining({
        id: signup.body.data.user.id,
        name: student.name,
        email: "ada@example.com",
        role: "STUDENT",
        createdAt: expect.any(String),
      }),
    );
    expect(response.body.data.user).not.toHaveProperty("passwordHash");
  });

  it("blocks students from mentor-only routes and allows mentors", async () => {
    const studentSignup = await request(app).post("/api/auth/signup").send(student);
    const studentToken = studentSignup.body.data.token as string;

    const studentDenied = await request(app)
      .get("/api/auth/mentor-check")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(studentDenied.status).toBe(403);

    await seedMentorAccount(prisma, {
      name: "Mentor Admin",
      email: "mentor@example.com",
      password: "MentorPass123!",
    });

    const mentorLogin = await request(app).post("/api/auth/login").send({
      email: "mentor@example.com",
      password: "MentorPass123!",
    });

    const mentorAllowed = await request(app)
      .get("/api/auth/mentor-check")
      .set("Authorization", `Bearer ${mentorLogin.body.data.token}`);

    expect(mentorAllowed.status).toBe(200);
    expect(mentorAllowed.body.message).toBe("Mentor access granted");
  });

  it("seeds a mentor account idempotently and refuses incompatible accounts", async () => {
    const first = await seedMentorAccount(prisma, {
      name: "Mentor Admin",
      email: "Mentor@Example.com",
      password: "MentorPass123!",
    });
    expect(first.status).toBe("created");

    const second = await seedMentorAccount(prisma, {
      name: "Different Name",
      email: "mentor@example.com",
      password: "DifferentPass123!",
    });
    expect(second.status).toBe("unchanged");

    const mentor = await prisma.user.findUnique({ where: { email: "mentor@example.com" } });
    expect(mentor?.name).toBe("Mentor Admin");
    expect(mentor?.role).toBe("MENTOR");

    await request(app).post("/api/auth/signup").send({
      name: "Student Occupying Email",
      email: "taken@example.com",
      password: "StudentPass123!",
    });

    await expect(
      seedMentorAccount(prisma, {
        name: "Mentor Admin",
        email: "taken@example.com",
        password: "MentorPass123!",
      }),
    ).rejects.toThrow(/Refusing to change role or password/);

    const taken = await prisma.user.findUnique({ where: { email: "taken@example.com" } });
    expect(taken?.role).toBe("STUDENT");
  });
});
