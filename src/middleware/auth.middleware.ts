import type { NextFunction, Request, Response } from "express";
import { logger } from "../config/logger.js";
import { ERROR_CODES } from "../constants/index.js";
import { userRepository } from "../modules/user/user.repository.js";
import { ApiError } from "../utils/ApiError.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { setRequestUser } from "../utils/requestContext.js";

export const authenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.header("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new ApiError(401, ERROR_CODES.UNAUTHORIZED, "Authentication required");
    }

    const token = authHeader.slice("Bearer ".length);
    const payload = verifyAccessToken(token);
    const user = await userRepository.findById(payload.sub);

    if (!user) {
      throw new ApiError(401, ERROR_CODES.UNAUTHORIZED, "Authentication required");
    }

    req.user = { id: user.id, email: user.email, role: user.role };
    setRequestUser(user.id);

    logger.debug("Authentication check passed", {
      requestId: req.requestId,
      userId: user.id,
      action: "AUTHENTICATE_REQUEST",
    });

    next();
  } catch (error) {
    next(error);
  }
};
