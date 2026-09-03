import { Response, Request } from "express";
import { ApiError } from "../../../utils/ApiError.js";
import { createUpload } from "../services/upload.service.js";
import { completeUpload, getVideo } from "../services/video.service.js";
import { initializeUploadSchema } from "../../../types/video.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";

const getVideoIdParams = (req: Request) => {
  const videoId = req.params.videoId;
  if (typeof videoId !== "string") {
    throw new ApiError(400, "INVALID_VIDEO_ID", "Video ID must be a string");
  }
  return videoId;
};

export const createUploadController = asyncHandler(async (req: Request, res: Response) => {
  const parsed = initializeUploadSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "INVALID_UPLOAD_INPUT", "Invalid upload request", {
      details: parsed.error.flatten(),
    });
  }
  const result = await createUpload(parsed.data);
  return res.status(201).json(result);
});

export const completeUploadController = asyncHandler(async (req: Request, res: Response) => {
  const result = await completeUpload(getVideoIdParams(req));
  return res.status(200).json(result);
});

export const getVideoController = asyncHandler(async (req: Request, res: Response) => {
  const result = await getVideo(getVideoIdParams(req));
  return res.status(200).json(result);
});
