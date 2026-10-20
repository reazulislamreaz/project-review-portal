import dotenv from "dotenv";

dotenv.config();

const DEFAULT_PORT = 4000;

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

/**
 * DATABASE_URL is optional at process boot so the HTTP server can start
 * without a live database. Prisma reads it when database operations run.
 */
export const env = {
  nodeEnv: parseNodeEnv(process.env.NODE_ENV),
  port: parsePort(process.env.PORT),
  databaseUrl: process.env.DATABASE_URL,
} as const;
