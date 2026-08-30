import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../config/logger.js";
import { isProduction } from "../config/env.js";
import { ERROR_CODES } from "../constants/index.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { sanitizeObject } from "../utils/sanitize.js";

const zodDetails = (error: ZodError) =>
  error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }));

export const errorMiddleware = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): Response => {
  const apiError =
    err instanceof ApiError
      ? err
      : err instanceof ZodError
        ? new ApiError(400, ERROR_CODES.VALIDATION_ERROR, "Invalid request", { details: zodDetails(err) })
        : new ApiError(500, ERROR_CODES.INTERNAL_SERVER_ERROR, "Internal server error", {
            cause: err,
            isOperational: false,
          });

  const cause = err instanceof Error ? err : undefined;
  logger.log(apiError.statusCode >= 500 ? "error" : "warn", apiError.message, {
    requestId: req.requestId,
    statusCode: apiError.statusCode,
    code: apiError.code,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id,
    params: sanitizeObject(req.params),
    query: sanitizeObject(req.query),
    error: {
      name: cause?.name ?? apiError.name,
      message: cause?.message ?? apiError.message,
      stack: cause?.stack ?? apiError.stack,
    },
  });

  const exposeDetails = !isProduction || apiError.statusCode < 500;
  return ApiResponse.error(res, apiError.statusCode, {
    code: apiError.statusCode >= 500 && isProduction ? ERROR_CODES.INTERNAL_SERVER_ERROR : apiError.code,
    message: apiError.statusCode >= 500 && isProduction ? "Internal server error" : apiError.message,
    ...(exposeDetails && apiError.details !== undefined ? { details: apiError.details } : {}),
  });
};
