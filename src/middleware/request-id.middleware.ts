import type { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { runWithRequestContext } from "../utils/requestContext.js";

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const incomingRequestId = req.header("x-request-id");
  const requestId = incomingRequestId && incomingRequestId.trim() ? incomingRequestId : uuidv4();
  req.requestId = requestId;
  res.setHeader("X-Request-ID", requestId);
  runWithRequestContext({ requestId }, next);
};
