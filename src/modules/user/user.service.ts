import { logger } from "../../config/logger.js";
import { ERROR_CODES } from "../../constants/index.js";
import { ApiError } from "../../utils/ApiError.js";
import { USER_LOG_ACTIONS } from "./user.constants.js";
import { userRepository } from "./user.repository.js";
import type { PublicUser, UpdateCurrentUserInput } from "./user.types.js";

const toPublicUser = (user: Awaited<ReturnType<typeof userRepository.findById>>): PublicUser => {
  if (!user) throw new ApiError(404, ERROR_CODES.USER_NOT_FOUND, "User not found");
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

export const userService = {
  async getCurrentUser(userId: string): Promise<PublicUser> {
    logger.debug("User service started", { action: USER_LOG_ACTIONS.GET_CURRENT_USER, userId });
    const user = await userRepository.findById(userId);
    const publicUser = toPublicUser(user);
    logger.info("Current user retrieved", { action: USER_LOG_ACTIONS.GET_CURRENT_USER, userId });
    return publicUser;
  },

  async updateCurrentUser(userId: string, input: UpdateCurrentUserInput): Promise<PublicUser> {
    logger.debug("User service started", { action: USER_LOG_ACTIONS.UPDATE_CURRENT_USER, userId });
    const user = await userRepository.updateById(userId, input);
    logger.info("Current user updated", { action: USER_LOG_ACTIONS.UPDATE_CURRENT_USER, userId });
    return toPublicUser(user);
  },

  async getUserById(userId: string): Promise<PublicUser> {
    logger.debug("User service started", { action: USER_LOG_ACTIONS.GET_USER_BY_ID, userId });
    const user = await userRepository.findById(userId);
    const publicUser = toPublicUser(user);
    logger.info("User retrieved", { action: USER_LOG_ACTIONS.GET_USER_BY_ID, userId });
    return publicUser;
  },
};
