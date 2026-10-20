import dotenv from "dotenv";

dotenv.config();

const DEFAULT_PORT = 4000;
const DEFAULT_JWT_EXPIRES_IN = "24h";
/** B0 D2: 5 submission attempts per 15 minutes per authenticated student. */
const DEFAULT_SUBMISSION_RATE_LIMIT_MAX = 5;
const DEFAULT_SUBMISSION_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

function parsePort(value: string | undefined): number {
  if (value === undefined || value.trim() === "") {
    return DEFAULT_PORT;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT value: "${value}". Expected an integer between 1 and 65535.`);
  }

  return port;
}

function parseNodeEnv(value: string | undefined): "development" | "production" | "test" {
  const env = value ?? "development";

  if (env !== "development" && env !== "production" && env !== "test") {
    throw new Error(
      `Invalid NODE_ENV value: "${value}". Expected "development", "production", or "test".`,
    );
  }

  return env;
}

function requireNonEmpty(name: string, value: string | undefined): string {
  if (value === undefined || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const PLACEHOLDER_JWT_SECRET_PATTERN =
  /change-me|replace-with|your-secret|example-secret|\bTODO\b/i;

function parseJwtSecret(value: string | undefined, nodeEnv: string): string {
  const secret = requireNonEmpty("JWT_SECRET", value);

  if (nodeEnv === "production") {
    if (secret.length < 32) {
      throw new Error("JWT_SECRET must be at least 32 characters in production.");
    }

    if (PLACEHOLDER_JWT_SECRET_PATTERN.test(secret)) {
      throw new Error(
        "JWT_SECRET appears to be a placeholder value and is not allowed in production.",
      );
    }
  }

  return secret;
}

function parseJwtExpiresIn(value: string | undefined): string {
  if (value === undefined || value.trim() === "") {
    return DEFAULT_JWT_EXPIRES_IN;
  }

  return value.trim();
}

function parsePositiveInt(
  name: string,
  value: string | undefined,
  fallback: number,
): number {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`Invalid ${name} value: "${value}". Expected a positive integer.`);
  }

  return parsed;
}

/**
 * DATABASE_URL is optional at process boot so modules can load without a live database.
 * Prisma reads it when database operations run.
 *
 * JWT_SECRET is required in every environment that loads this module (including tests).
 * Mentor seed variables are optional at boot; the seed script validates them when run.
 */
export const env = {
  nodeEnv: parseNodeEnv(process.env.NODE_ENV),
  port: parsePort(process.env.PORT),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: parseJwtSecret(process.env.JWT_SECRET, parseNodeEnv(process.env.NODE_ENV)),
  jwtExpiresIn: parseJwtExpiresIn(process.env.JWT_EXPIRES_IN),
  mentorSeedName: process.env.MENTOR_SEED_NAME,
  mentorSeedEmail: process.env.MENTOR_SEED_EMAIL,
  mentorSeedPassword: process.env.MENTOR_SEED_PASSWORD,
  submissionRateLimitMax: parsePositiveInt(
    "SUBMISSION_RATE_LIMIT_MAX",
    process.env.SUBMISSION_RATE_LIMIT_MAX,
    DEFAULT_SUBMISSION_RATE_LIMIT_MAX,
  ),
  submissionRateLimitWindowMs: parsePositiveInt(
    "SUBMISSION_RATE_LIMIT_WINDOW_MS",
    process.env.SUBMISSION_RATE_LIMIT_WINDOW_MS,
    DEFAULT_SUBMISSION_RATE_LIMIT_WINDOW_MS,
  ),
} as const;
