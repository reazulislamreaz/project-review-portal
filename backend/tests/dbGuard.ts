import { URL } from "node:url";

/**
 * Prevent destructive test cleanup from running against development/production DBs.
 * Allowed database names must end with `_test`.
 */
export function getDatabaseName(databaseUrl: string): string {
  const parsed = new URL(databaseUrl);
  const dbName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));

  if (!dbName) {
    throw new Error("DATABASE_URL is missing a database name.");
  }

  return dbName;
}

export function assertSafeTestDatabaseUrl(databaseUrl: string | undefined): void {
  if (!databaseUrl || databaseUrl.trim() === "") {
    throw new Error("DATABASE_URL is required for tests.");
  }

  let dbName: string;

  try {
    dbName = getDatabaseName(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL for tests.");
  }

  if (!dbName.endsWith("_test")) {
    throw new Error(
      `Refusing to run tests against database "${dbName}". ` +
        "Configure .env.test so DATABASE_URL points at a dedicated database whose name ends with _test.",
    );
  }
}
