import { Router } from "express";
import {
  completeUploadController,
  createUploadController,
  getPlaybackUrlController,
  getVideoController,
} from "../controllers/video.controllers.js";

const router = Router();

router.post("/upload", createUploadController);
router.post("/:videoId/complete", completeUploadController);
router.get("/:videoId/playback", getPlaybackUrlController);
router.get("/:videoId", getVideoController);

export default router;
