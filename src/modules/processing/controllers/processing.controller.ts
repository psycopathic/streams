import { Request, Response } from "express";
import { ApiError } from "../../../utils/ApiError.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { startVideoProcessing } from "../services/processing.service.js";

const getVideoIdParam = (req: Request) => {
  const videoId = req.params.videoId;
  if (typeof videoId !== "string") {
    throw new ApiError(400, "INVALID_VIDEO_ID", "Video ID must be a string");
  }
  return videoId;
};

export const processVideoController = asyncHandler(async (req: Request, res: Response) => {
  const result = await startVideoProcessing(getVideoIdParam(req));
  return res.status(202).json(result);
});
