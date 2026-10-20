import dotenv from "dotenv";

dotenv.config();

const DEFAULT_PORT = 4000;
const DEFAULT_JWT_EXPIRES_IN = "24h";

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

function parseJwtSecret(value: string | undefined, nodeEnv: string): string {
  const secret = requireNonEmpty("JWT_SECRET", value);

  if (nodeEnv === "production" && secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters in production.");
  }

  return secret;
}

function parseJwtExpiresIn(value: string | undefined): string {
  if (value === undefined || value.trim() === "") {
    return DEFAULT_JWT_EXPIRES_IN;
  }

  return value.trim();
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
} as const;
