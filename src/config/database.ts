import pg from "pg";
import type { QueryResultRow } from "pg";
import { env } from "./env.js";
import { logger } from "./logger.js";

const { Pool } = pg;
let pool: pg.Pool | null = null;

export const getPool = (): pg.Pool => {
  if (!pool) {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      max: env.DB_POOL_MAX,
      idleTimeoutMillis: env.DB_POOL_IDLE_TIMEOUT_MS,
      connectionTimeoutMillis: env.DB_POOL_CONNECTION_TIMEOUT_MS,
    });

    pool.on("error", (error) => {
      logger.error("PostgreSQL pool error", {
        error: { name: error.name, message: error.message, stack: error.stack },
      });
    });
  }

  return pool;
};

export const query = async <T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<pg.QueryResult<T>> => {
  const startedAt = performance.now();
  try {
    const result = await getPool().query<T>(text, params);
    logger.debug("DB_QUERY", {
      operation: text.trim().split(/\s+/)[0]?.toUpperCase(),
      duration: Math.round((performance.now() - startedAt) * 100) / 100,
      rowCount: result.rowCount,
    });
    return result;
  } catch (error) {
    logger.error("Database query failed", {
      operation: text.trim().split(/\s+/)[0]?.toUpperCase(),
      duration: Math.round((performance.now() - startedAt) * 100) / 100,
      error,
    });
    throw error;
  }
};

export const connectDatabase = async (): Promise<void> => {
  await getPool().query("SELECT 1");
  logger.info("Database connected", { databaseUrlConfigured: Boolean(env.DATABASE_URL) });
};

export const disconnectDatabase = async (): Promise<void> => {
  if (!pool) return;
  await pool.end();
  pool = null;
  logger.info("Database disconnected");
};

export const checkDatabaseReadiness = async (): Promise<void> => {
  await query("SELECT 1");
};
