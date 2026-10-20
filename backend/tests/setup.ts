import dotenv from "dotenv";
import path from "node:path";
import { assertSafeTestDatabaseUrl } from "./dbGuard";

const testEnvPath = path.resolve(__dirname, "../.env.test");

const loaded = dotenv.config({
  path: testEnvPath,
  override: true,
});

if (loaded.error) {
  throw new Error(
    `Failed to load ${testEnvPath}. Copy .env.test.example to .env.test and point DATABASE_URL at a dedicated *_test database.`,
  );
}

if (process.env.NODE_ENV !== "test") {
  throw new Error(`Tests require NODE_ENV=test (got "${process.env.NODE_ENV ?? ""}").`);
}

assertSafeTestDatabaseUrl(process.env.DATABASE_URL);
