import type { NextFunction, Request, Response } from "express";
import { logger } from "../config/logger.js";

export const requestLoggerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startedAt = process.hrtime.bigint();

  logger.http("HTTP request started", {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    logger.http("HTTP request completed", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      duration: Math.round(durationMs * 100) / 100,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      contentLength: res.getHeader("content-length"),
    });
  });

  next();
};
