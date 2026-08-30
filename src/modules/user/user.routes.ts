import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import { userController } from "./user.controller.js";
import { updateCurrentUserSchema, userIdParamsSchema } from "./user.validation.js";

export const userRoutes = Router();

userRoutes.use(authenticate);
userRoutes.get("/me", userController.getMe);
userRoutes.patch("/me", validate({ body: updateCurrentUserSchema }), userController.updateMe);
userRoutes.get("/:id", validate({ params: userIdParamsSchema }), userController.getById);
