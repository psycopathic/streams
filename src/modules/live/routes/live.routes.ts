import { Router } from "express";
import {
  createLiveStreamController,
  getLivePlaybackController,
  getLiveStreamController,
  stopLiveStreamController,
} from "../controllers/live.controllers.js";

const router = Router();

router.post("/", createLiveStreamController);
router.get("/:streamId/play", getLivePlaybackController);
router.get("/:streamId", getLiveStreamController);
router.post("/:streamId/stop", stopLiveStreamController);

export default router;
