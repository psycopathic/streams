import jwt, { type SignOptions } from "jsonwebtoken";
import type { StringValue } from "ms";
import { env } from "../config/env.js";
import { ERROR_CODES } from "../constants/index.js";
import { ApiError } from "./ApiError.js";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
  type: "access";
}

export interface RefreshTokenPayload {
  sub: string;
  tokenId: string;
  type: "refresh";
}

const signToken = (payload: object, secret: string, expiresIn: StringValue): string => {
  const options: SignOptions = { expiresIn };
  return jwt.sign(payload, secret, options);
};

export const signAccessToken = (payload: Omit<AccessTokenPayload, "type">): string => {
  return signToken({ ...payload, type: "access" }, env.JWT_ACCESS_SECRET, env.JWT_ACCESS_EXPIRES_IN as StringValue);
};

export const signRefreshToken = (payload: Omit<RefreshTokenPayload, "type">): string => {
  return signToken({ ...payload, type: "refresh" }, env.JWT_REFRESH_SECRET, env.JWT_REFRESH_EXPIRES_IN as StringValue);
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    if (!decoded || typeof decoded !== "object" || decoded.type !== "access") {
      throw new ApiError(401, ERROR_CODES.INVALID_TOKEN, "Invalid access token");
    }
    return decoded as AccessTokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(401, ERROR_CODES.TOKEN_EXPIRED, "Access token expired", { cause: error });
    }
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, ERROR_CODES.INVALID_TOKEN, "Invalid access token", { cause: error });
  }
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
    if (!decoded || typeof decoded !== "object" || decoded.type !== "refresh") {
      throw new ApiError(401, ERROR_CODES.INVALID_TOKEN, "Invalid refresh token");
    }
    return decoded as RefreshTokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(401, ERROR_CODES.TOKEN_EXPIRED, "Refresh token expired", { cause: error });
    }
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, ERROR_CODES.INVALID_TOKEN, "Invalid refresh token", { cause: error });
  }
};
