import { query } from "../../config/database.js";
import { logger } from "../../config/logger.js";

export interface RefreshTokenRecord {
  id: string;
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

interface RefreshTokenRow {
  id: string;
  token_hash: string;
  user_id: string;
  expires_at: Date;
  revoked_at: Date | null;
  created_at: Date;
}

const mapRefreshToken = (row: RefreshTokenRow): RefreshTokenRecord => ({
  id: row.id,
  tokenHash: row.token_hash,
  userId: row.user_id,
  expiresAt: row.expires_at,
  revokedAt: row.revoked_at,
  createdAt: row.created_at,
});

export const authRepository = {
  async createRefreshToken(data: {
    tokenHash: string;
    userId: string;
    expiresAt: Date;
  }): Promise<RefreshTokenRecord> {
    const startedAt = performance.now();
    logger.debug("Repository query started", { model: "RefreshToken", operation: "create" });
    const result = await query<RefreshTokenRow>(
      `INSERT INTO refresh_tokens (token_hash, user_id, expires_at)
       VALUES ($1, $2, $3)
       RETURNING id, token_hash, user_id, expires_at, revoked_at, created_at`,
      [data.tokenHash, data.userId, data.expiresAt],
    );
    logger.debug("Repository query completed", {
      model: "RefreshToken",
      operation: "create",
      duration: Math.round((performance.now() - startedAt) * 100) / 100,
    });
    return mapRefreshToken(result.rows[0]!);
  },

  async findRefreshTokenByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    const startedAt = performance.now();
    logger.debug("Repository query started", { model: "RefreshToken", operation: "findUniqueByHash" });
    const result = await query<RefreshTokenRow>(
      `SELECT id, token_hash, user_id, expires_at, revoked_at, created_at
       FROM refresh_tokens
       WHERE token_hash = $1`,
      [tokenHash],
    );
    logger.debug("Repository query completed", {
      model: "RefreshToken",
      operation: "findUniqueByHash",
      duration: Math.round((performance.now() - startedAt) * 100) / 100,
    });
    return result.rows[0] ? mapRefreshToken(result.rows[0]) : null;
  },

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    const startedAt = performance.now();
    logger.debug("Repository query started", { model: "RefreshToken", operation: "revokeByHash" });
    await query("UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1", [tokenHash]);
    logger.debug("Repository query completed", {
      model: "RefreshToken",
      operation: "revokeByHash",
      duration: Math.round((performance.now() - startedAt) * 100) / 100,
    });
  },

  async revokeUserRefreshTokens(userId: string): Promise<void> {
    const startedAt = performance.now();
    logger.debug("Repository query started", { model: "RefreshToken", operation: "revokeByUserId" });
    await query("UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL", [userId]);
    logger.debug("Repository query completed", {
      model: "RefreshToken",
      operation: "revokeByUserId",
      duration: Math.round((performance.now() - startedAt) * 100) / 100,
    });
  },
};
