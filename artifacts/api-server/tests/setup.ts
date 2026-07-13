import path from "node:path";
import fs from "node:fs";
import { beforeAll, afterAll } from "vitest";

const TEST_DB_PATH = path.join(process.cwd(), "data", "test.sqlite");

// Point the shared Sequelize connection at a dedicated test database file
// BEFORE any module imports `@workspace/db-sequelize`, so the singleton
// connection created at import time uses it instead of the dev database.
process.env["SQLITE_STORAGE"] = TEST_DB_PATH;
process.env["NODE_ENV"] = process.env["NODE_ENV"] ?? "test";

beforeAll(async () => {
  fs.mkdirSync(path.dirname(TEST_DB_PATH), { recursive: true });
  fs.rmSync(TEST_DB_PATH, { force: true });
  const { ensureDatabaseReady } = await import("@workspace/db-sequelize");
  await ensureDatabaseReady();
});

afterAll(async () => {
  const { sequelize } = await import("@workspace/db-sequelize");
  await sequelize.close();
});

export { TEST_DB_PATH };
