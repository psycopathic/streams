import { ApiError } from "../../../utils/ApiError.js";
import { logger } from "../../../config/logger.js";
import {
  findVideoAssets,
  findVideoById,
  updateVideoStatus,
} from "../repositories/video.repository.js";
import { env } from "../../../config/env.js";
import { verifyObjectExists } from "../../../utils/s3.js";
// import { verify } from "crypto";

// const triggerProcessing = async () => {
//     const response = await fetch
// }

export const completeUpload = async (videoId: string) => {
  const video = await findVideoById(videoId);
  if (!video) {
    throw new ApiError(404, "VIDEO_NOT_FOUND", `Video with ID ${videoId} not found`);
  }
  if (video.status !== "UPLOADING") {
    throw new ApiError(
      409,
      "INVALID_VIDEO_STATUS",
      `Cannot complete upload while video status is ${video.status}`,
    );
  }
  try {
    await verifyObjectExists(video.original_storage_key);
  } catch (error) {
    throw new ApiError(500, "UPLOAD_FAILED", `Failed to complete upload for video ${videoId}`);
  }
  await updateVideoStatus(videoId, "UPLOADED");
  logger.info(`Upload completed for video on S3 ${videoId}`);

  //   await triggerProcessing(videoId);

  return {
    message: "upload completed successfully",
    videoId: videoId,
    status: "UPLOADED",
  };
};

export const getVideo = async (videoId: string) => {
  const video = await findVideoById(videoId);
  if (!video) {
    throw new ApiError(404, "VIDEO_NOT_FOUND", `Video with ID ${videoId} not found`);
  }

  const assets = await findVideoAssets(videoId);
  return {
    id: video.id,
    title: video.title,
    description: video.description,
    status: video.status,
    duration: video.duration === null ? null : Number(video.duration),
    width: video.width,
    height: video.height,
    assets: assets.map((asset) => ({
      resolution: asset.resolution,
      width: asset.width,
      height: asset.height,
      videoBitrate: asset.video_bitrate,
      audioBitrate: asset.audio_bitrate,
      format: asset.format,
      storageKey: asset.storage_key,
    })),
  };
};
