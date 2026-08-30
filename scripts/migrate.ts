import fs from "node:fs/promises";
import path from "node:path";
import { connectDatabase, disconnectDatabase, query } from "../src/config/database.js";
import { logger } from "../src/config/logger.js";

const run = async (): Promise<void> => {
  await connectDatabase();
  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const migrationsDir = path.resolve(process.cwd(), "sql");
  const files = (await fs.readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();

  for (const file of files) {
    const existing = await query<{ id: string }>("SELECT id FROM schema_migrations WHERE id = $1", [file]);
    if (existing.rowCount && existing.rowCount > 0) continue;

    const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
    await query("BEGIN");
    try {
      await query(sql);
      await query("INSERT INTO schema_migrations (id) VALUES ($1)", [file]);
      await query("COMMIT");
      logger.info("Migration applied", { migration: file });
    } catch (error) {
      await query("ROLLBACK");
      throw error;
    }
  }
};

void run()
  .then(async () => {
    await disconnectDatabase();
  })
  .catch(async (error: unknown) => {
    logger.error("Migration failed", { error });
    await disconnectDatabase();
    process.exit(1);
  });
