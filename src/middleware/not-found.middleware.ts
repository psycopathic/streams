import type { NextFunction, Request, Response } from "express";
import { ERROR_CODES } from "../constants/index.js";
import { ApiError } from "../utils/ApiError.js";

export const notFoundMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  next(new ApiError(404, ERROR_CODES.RESOURCE_NOT_FOUND, `Route not found: ${req.method} ${req.originalUrl}`));
};
