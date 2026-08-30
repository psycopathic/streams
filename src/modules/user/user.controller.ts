import type { Request, Response } from "express";
import { logger } from "../../config/logger.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { userService } from "./user.service.js";
import type { UpdateCurrentUserBody } from "./user.validation.js";

export const userController = {
  getMe: asyncHandler(async (req: Request, res: Response) => {
    logger.info("User controller called", { requestId: req.requestId, action: "GET_USERS_ME", userId: req.user?.id });
    const user = await userService.getCurrentUser(req.user!.id);
    return ApiResponse.success(res, user);
  }),

  updateMe: asyncHandler(async (req: Request<object, object, UpdateCurrentUserBody>, res: Response) => {
    logger.info("User controller called", { requestId: req.requestId, action: "PATCH_USERS_ME", userId: req.user?.id });
    const user = await userService.updateCurrentUser(req.user!.id, req.body);
    return ApiResponse.success(res, user);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    logger.info("User controller called", { requestId: req.requestId, action: "GET_USER_BY_ID", targetUserId: id, userId: req.user?.id });
    const user = await userService.getUserById(id);
    return ApiResponse.success(res, user);
  }),
};
