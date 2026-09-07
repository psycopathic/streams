import type { Router } from "express";
import { API_PREFIX } from "../constants/index.js";
import processingRouter from "../modules/processing/routes/processing.routes.js";
import videoRouter from "../modules/video/routes/video.routes.js";
import liveRoutes from "../modules/live/routes/live.routes.js";

export const registerRoutes = (router: Router) => {
  router.use(`${API_PREFIX}/videos`, videoRouter);
  router.use(`${API_PREFIX}/videos`, processingRouter);
  router.use(`${API_PREFIX}/live`, liveRoutes);
};
