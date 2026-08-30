import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { ERROR_CODES } from "../constants/index.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const rateLimitMiddleware = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn("Rate limit exceeded", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
    });
    return ApiResponse.error(res, 429, {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: "Too many requests",
    });
  },
});
