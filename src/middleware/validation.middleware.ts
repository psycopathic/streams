import type { NextFunction, Request, Response } from "express";
import type { ZodError, ZodSchema } from "zod";
import { ERROR_CODES } from "../constants/index.js";
import { ApiError } from "../utils/ApiError.js";

type RequestPart = "body" | "params" | "query" | "headers";

type ValidationSchemas = Partial<Record<RequestPart, ZodSchema>>;

const formatZodError = (error: ZodError) =>
  error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));

export const validate = (schemas: ValidationSchemas) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      for (const [part, schema] of Object.entries(schemas) as [RequestPart, ZodSchema][]) {
        const parsed = schema.safeParse(req[part]);
        if (!parsed.success) {
          throw new ApiError(400, ERROR_CODES.VALIDATION_ERROR, "Invalid request", {
            details: formatZodError(parsed.error),
          });
        }
        Object.assign(req[part], parsed.data);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
