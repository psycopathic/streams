import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import { authController } from "./auth.controller.js";
import { loginSchema, refreshSchema, registerSchema } from "./auth.validation.js";

export const authRoutes = Router();

authRoutes.post("/register", validate({ body: registerSchema }), authController.register);
authRoutes.post("/login", validate({ body: loginSchema }), authController.login);
authRoutes.post("/logout", authenticate, authController.logout);
authRoutes.post("/refresh", validate({ body: refreshSchema }), authController.refresh);
authRoutes.get("/me", authenticate, authController.me);
