import type { Response } from "express";
import type { PaginationMeta } from "../types/common.types.js";

interface ApiResponseMeta {
  requestId: string;
  pagination?: PaginationMeta;
}

export class ApiResponse {
  static success<T>(res: Response, data: T, statusCode = 200, pagination?: PaginationMeta): Response {
    const meta: ApiResponseMeta = { requestId: res.req.requestId };
    if (pagination) meta.pagination = pagination;
    return res.status(statusCode).json({ success: true, data, meta });
  }

  static error(
    res: Response,
    statusCode: number,
    error: { code: string; message: string; details?: unknown },
  ): Response {
    return res.status(statusCode).json({
      success: false,
      error,
      meta: { requestId: res.req.requestId },
    });
  }
}
