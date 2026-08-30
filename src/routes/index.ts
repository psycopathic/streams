import { Router } from "express";
import { checkDatabaseReadiness } from "../config/database.js";
import { API_PREFIX } from "../constants/index.js";
import { authRoutes } from "../modules/auth/auth.routes.js";
import { userRoutes } from "../modules/user/user.routes.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const registerRoutes = (appRouter: Router): void => {
  appRouter.get("/health", (req, res) => ApiResponse.success(res, { status: "healthy" }));
  appRouter.get(
    "/ready",
    asyncHandler(async (_req, res) => {
      await checkDatabaseReadiness();
      return ApiResponse.success(res, { status: "ready" });
    }),
  );

  const apiRouter = Router();
  apiRouter.use("/auth", authRoutes);
  apiRouter.use("/users", userRoutes);
  appRouter.use(API_PREFIX, apiRouter);
};
