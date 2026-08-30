import { query } from "../../config/database.js";
import { logger } from "../../config/logger.js";
import type { UserRecord, UserRole } from "./user.types.js";

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

const mapUser = (row: UserRow): UserRecord => ({
  id: row.id,
  email: row.email,
  passwordHash: row.password_hash,
  name: row.name,
  role: row.role,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const userRepository = {
  async create(data: { email: string; passwordHash: string; name?: string | undefined }): Promise<UserRecord> {
    const startedAt = performance.now();
    logger.debug("Repository query started", { model: "User", operation: "create" });
    const result = await query<UserRow>(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, password_hash, name, role, created_at, updated_at`,
      [data.email, data.passwordHash, data.name ?? null],
    );
    logger.debug("Repository query completed", {
      model: "User",
      operation: "create",
      duration: Math.round((performance.now() - startedAt) * 100) / 100,
    });
    return mapUser(result.rows[0]!);
  },

  async findByEmail(email: string): Promise<UserRecord | null> {
    const startedAt = performance.now();
    logger.debug("Repository query started", { model: "User", operation: "findUniqueByEmail" });
    const result = await query<UserRow>(
      `SELECT id, email, password_hash, name, role, created_at, updated_at
       FROM users
       WHERE email = $1`,
      [email],
    );
    logger.debug("Repository query completed", {
      model: "User",
      operation: "findUniqueByEmail",
      duration: Math.round((performance.now() - startedAt) * 100) / 100,
    });
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  },

  async findById(id: string): Promise<UserRecord | null> {
    const startedAt = performance.now();
    logger.debug("Repository query started", { model: "User", operation: "findUniqueById" });
    const result = await query<UserRow>(
      `SELECT id, email, password_hash, name, role, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [id],
    );
    logger.debug("Repository query completed", {
      model: "User",
      operation: "findUniqueById",
      duration: Math.round((performance.now() - startedAt) * 100) / 100,
    });
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  },

  async updateById(id: string, data: { name?: string | null | undefined }): Promise<UserRecord> {
    const startedAt = performance.now();
    logger.debug("Repository query started", { model: "User", operation: "updateById" });
    const shouldUpdateName = Object.hasOwn(data, "name");
    const result = await query<UserRow>(
      `UPDATE users
       SET name = CASE WHEN $2::boolean THEN $3 ELSE name END,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, email, password_hash, name, role, created_at, updated_at`,
      [id, shouldUpdateName, data.name ?? null],
    );
    logger.debug("Repository query completed", {
      model: "User",
      operation: "updateById",
      duration: Math.round((performance.now() - startedAt) * 100) / 100,
    });
    return mapUser(result.rows[0]!);
  },
};
