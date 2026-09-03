import type { ERROR_CODES } from "../constants/index.js";

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface RequestContext {
  requestId: string;
}
