import { ERROR_CODES } from "../constants/index.js";
import type { ErrorCode } from "../types/common.types.js";

interface ApiErrorOptions {
  details?: unknown;
  cause?: unknown;
  isOperational?: boolean;
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly details?: unknown;
  readonly isOperational: boolean;

  constructor(statusCode: number, code: ErrorCode, message: string, options: ApiErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = options.details;
    this.isOperational = options.isOperational ?? true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const internalServerError = (cause?: unknown): ApiError =>
  new ApiError(500, ERROR_CODES.INTERNAL_SERVER_ERROR, "Internal server error", {
    cause,
    isOperational: false,
  });
