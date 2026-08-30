import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Router } from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { notFoundMiddleware } from "./middleware/not-found.middleware.js";
import { rateLimitMiddleware } from "./middleware/rate-limit.middleware.js";
import { requestIdMiddleware } from "./middleware/request-id.middleware.js";
import { requestLoggerMiddleware } from "./middleware/request-logger.middleware.js";
import { registerRoutes } from "./routes/index.js";

export const createApp = () => {
  const app = express();
  const router = Router();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(requestIdMiddleware);
  app.use(requestLoggerMiddleware);
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
      credentials: true,
    }),
  );
  app.use(rateLimitMiddleware);
  app.use(express.json({ limit: env.REQUEST_BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: env.REQUEST_BODY_LIMIT }));
  app.use(cookieParser());
  app.use(compression());

  registerRoutes(router);
  app.use(router);
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
};

export const app = createApp();
