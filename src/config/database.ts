import { logger } from "./logger.js";
import { Pool, type QueryResult, type QueryResultRow } from "pg";

let pool: Pool | null = null;

export const getPool = () => {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      logger.error("DATABASE_URL is not set");
      throw new Error("DATABASE_URL is not set");
    }
    pool = new Pool({
      connectionString,
    });
  }
  return pool;
};

export const connectDatabase = async () => {
  await getPool().query("SELECT 1");
  logger.info("Database connected");
};

export const query = async <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> => {
  return getPool().query<T>(text, params);
};

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export const disconnectDatabase = closePool;
