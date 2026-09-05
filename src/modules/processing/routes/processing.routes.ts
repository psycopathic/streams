import { Router } from "express";
import { processVideoController } from "../controllers/processing.controller.js";

const router = Router();

router.post("/:videoId/process", processVideoController);

export default router;
