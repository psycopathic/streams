import type { Request, Response } from "express";
import { isProduction } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { userService } from "../user/user.service.js";
import { AUTH_COOKIE_NAMES } from "./auth.constants.js";
import { authService } from "./auth.service.js";
import type { LoginBody, RefreshBody, RegisterBody } from "./auth.validation.js";

const setRefreshCookie = (res: Response, refreshToken: string): void => {
  res.cookie(AUTH_COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: "/api/v1/auth",
  });
};

const clearRefreshCookie = (res: Response): void => {
  res.clearCookie(AUTH_COOKIE_NAMES.REFRESH_TOKEN, { path: "/api/v1/auth" });
};

const authPayload = (result: Awaited<ReturnType<typeof authService.login>>) => ({
  user: result.user,
  accessToken: result.accessToken,
  refreshToken: result.refreshToken,
});

export const authController = {
  register: asyncHandler(async (req: Request<object, object, RegisterBody>, res: Response) => {
    logger.info("Auth controller called", { requestId: req.requestId, action: "REGISTER", email: req.body.email, ip: req.ip, method: req.method, path: req.originalUrl });
    const result = await authService.register(req.body);
    setRefreshCookie(res, result.refreshToken);
    return ApiResponse.success(res, authPayload(result), 201);
  }),

  login: asyncHandler(async (req: Request<object, object, LoginBody>, res: Response) => {
    logger.info("Auth controller called", { requestId: req.requestId, action: "LOGIN", email: req.body.email, ip: req.ip, method: req.method, path: req.originalUrl });
    const result = await authService.login(req.body);
    setRefreshCookie(res, result.refreshToken);
    return ApiResponse.success(res, authPayload(result));
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    logger.info("Auth controller called", { requestId: req.requestId, action: "LOGOUT", userId: req.user?.id });
    const cookieToken = req.cookies[AUTH_COOKIE_NAMES.REFRESH_TOKEN] as string | undefined;
    await authService.logout(cookieToken, req.user?.id);
    clearRefreshCookie(res);
    return ApiResponse.success(res, { message: "Logged out successfully" });
  }),

  refresh: asyncHandler(async (req: Request<object, object, RefreshBody>, res: Response) => {
    logger.info("Auth controller called", { requestId: req.requestId, action: "REFRESH" });
    const cookieToken = req.cookies[AUTH_COOKIE_NAMES.REFRESH_TOKEN] as string | undefined;
    const refreshToken = req.body.refreshToken ?? cookieToken;
    if (!refreshToken) {
      return ApiResponse.error(res, 401, { code: "UNAUTHORIZED", message: "Refresh token required" });
    }
    const result = await authService.refresh(refreshToken);
    setRefreshCookie(res, result.refreshToken);
    return ApiResponse.success(res, authPayload(result));
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    logger.info("Auth controller called", { requestId: req.requestId, action: "AUTH_ME", userId: req.user?.id });
    const user = await userService.getCurrentUser(req.user!.id);
    return ApiResponse.success(res, user);
  }),
};
