import { ApiError } from "../../../utils/ApiError.js";
import { logger } from "../../../config/logger.js";
import {
  findVideoAssets,
  findVideoById,
  updateVideoStatus,
} from "../repositories/video.repository.js";
import { startVideoProcessing } from "../../processing/services/processing.service.js";
import { verifyObjectExists, createPlaybackUrl } from "../../../utils/s3.js";

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

  const processing = await startVideoProcessing(videoId);

  return {
    message: "upload completed successfully and processing started",
    videoId: videoId,
    status: processing.status,
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

export const getPlaybackUrl = async (videoId: string) => {
  const video = await findVideoById(videoId);
  if (!video) {
    throw new ApiError(404, "VIDEO_NOT_FOUND", `Video with ID ${videoId} not found`);
  }
  if (video.status !== "READY") {
    throw new ApiError(
      409,
      "INVALID_VIDEO_STATUS",
      `Cannot get playback URL while video status is ${video.status}`,
    );
  }
  const assets = await findVideoAssets(videoId);
  const sources = await Promise.all(
    assets.map(async (asset) => {
      const url = await createPlaybackUrl(asset.storage_key);
      return {
        resolution: asset.resolution,
        width: asset.width,
        height: asset.height,
        videoBitrate: asset.video_bitrate,
        audioBitrate: asset.audio_bitrate,
        format: asset.format,
        playbackUrl: url,
      };
    }),
  );
  return {
    videoId: video.id,
    title: video.title,
    duration: video.duration,
    sources,
  };
};
