import crypto from "node:crypto";
import ms, { type StringValue } from "ms";
import { logger } from "../../config/logger.js";
import { env } from "../../config/env.js";
import { ERROR_CODES } from "../../constants/index.js";
import { ApiError } from "../../utils/ApiError.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import { userRepository } from "../user/user.repository.js";
import type { PublicUser } from "../user/user.types.js";
import { AUTH_LOG_ACTIONS } from "./auth.constants.js";
import { authRepository } from "./auth.repository.js";
import type { AuthResult, LoginInput, RegisterInput } from "./auth.types.js";

const toPublicUser = (user: NonNullable<Awaited<ReturnType<typeof userRepository.findById>>>): PublicUser => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const hashRefreshToken = (token: string): string => crypto.createHash("sha256").update(token).digest("hex");

const refreshExpiresAt = (): Date => {
  const duration = ms(env.JWT_REFRESH_EXPIRES_IN as StringValue);
  if (typeof duration !== "number") throw new Error("Invalid JWT_REFRESH_EXPIRES_IN value");
  return new Date(Date.now() + duration);
};

const issueTokens = async (user: NonNullable<Awaited<ReturnType<typeof userRepository.findById>>>) => {
  const tokenId = crypto.randomUUID();
  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id, tokenId });
  await authRepository.createRefreshToken({
    tokenHash: hashRefreshToken(refreshToken),
    userId: user.id,
    expiresAt: refreshExpiresAt(),
  });
  return { accessToken, refreshToken };
};

export const authService = {
  async register(input: RegisterInput): Promise<AuthResult> {
    logger.debug("Auth service started", { action: AUTH_LOG_ACTIONS.REGISTER, email: input.email });
    const existingUser = await userRepository.findByEmail(input.email);
    if (existingUser) {
      logger.warn("User registration rejected", { action: AUTH_LOG_ACTIONS.REGISTER, reason: "EMAIL_EXISTS", email: input.email });
      throw new ApiError(409, ERROR_CODES.USER_ALREADY_EXISTS, "User already exists");
    }

    const passwordHash = await hashPassword(input.password);
    const user = await userRepository.create({ email: input.email, passwordHash, name: input.name });
    const tokens = await issueTokens(user);

    logger.info("User registered", { action: AUTH_LOG_ACTIONS.REGISTER, userId: user.id, email: user.email });
    return { user: toPublicUser(user), ...tokens };
  },

  async login(input: LoginInput): Promise<AuthResult> {
    logger.debug("Auth service started", { action: AUTH_LOG_ACTIONS.LOGIN, email: input.email });
    const user = await userRepository.findByEmail(input.email);
    if (!user || !(await verifyPassword(user.passwordHash, input.password))) {
      logger.warn("Invalid authentication attempt", { action: AUTH_LOG_ACTIONS.LOGIN, email: input.email });
      throw new ApiError(401, ERROR_CODES.INVALID_CREDENTIALS, "Invalid credentials");
    }

    const tokens = await issueTokens(user);
    logger.info("User login successful", { action: AUTH_LOG_ACTIONS.LOGIN, userId: user.id, email: user.email });
    return { user: toPublicUser(user), ...tokens };
  },

  async logout(refreshToken: string | undefined, userId?: string): Promise<void> {
    logger.debug("Auth service started", { action: AUTH_LOG_ACTIONS.LOGOUT, userId });
    if (refreshToken) await authRepository.revokeRefreshToken(hashRefreshToken(refreshToken));
    logger.info("User logout completed", { action: AUTH_LOG_ACTIONS.LOGOUT, userId });
  },

  async refresh(refreshToken: string): Promise<AuthResult> {
    logger.debug("Auth service started", { action: AUTH_LOG_ACTIONS.REFRESH });
    const payload = verifyRefreshToken(refreshToken);
    const tokenRecord = await authRepository.findRefreshTokenByHash(hashRefreshToken(refreshToken));

    if (!tokenRecord || tokenRecord.revokedAt || tokenRecord.expiresAt <= new Date() || tokenRecord.userId !== payload.sub) {
      logger.warn("Refresh token rejected", { action: AUTH_LOG_ACTIONS.REFRESH, userId: payload.sub });
      throw new ApiError(401, ERROR_CODES.INVALID_TOKEN, "Invalid refresh token");
    }

    await authRepository.revokeRefreshToken(hashRefreshToken(refreshToken));
    const user = await userRepository.findById(payload.sub);
    if (!user) throw new ApiError(401, ERROR_CODES.UNAUTHORIZED, "Authentication required");

    const tokens = await issueTokens(user);
    logger.info("Access token refreshed", { action: AUTH_LOG_ACTIONS.REFRESH, userId: user.id });
    return { user: toPublicUser(user), ...tokens };
  },
};
