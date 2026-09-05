import { mkdir, rm } from "fs/promises"; // linux command for creating and removing directories
import path from "path"; //path module for handling and transforming file paths
import { logger } from "../../../config/logger.js";
import {
  createVideoAsset,
  findVideoById,
  updateVideoMetadata,
  updateVideoStatus,
} from "../../video/repositories/video.repository.js";

import { bitrateToNumber, getTranscodeTargets } from "../services/transcode-plan.service.js";
import { probeVideo, transcodeVideo } from "../../../utils/ffmpeg.js";
import { downloadFromS3, uploadFileToS3 } from "../../../utils/s3.js";

export const processVideo = async (videoId: string) => {
  const tempDir = path.join("/tmp/video-processing", videoId); // Create a temporary directory for processing the video
  const sourcePath = path.join(tempDir, "source"); // Path to store the downloaded source video

  try {
    const video = await findVideoById(videoId);
    if (!video || video.status !== "UPLOADED") {
      return;
    }
    await updateVideoStatus(videoId, "PROCESSING");
    logger.info("PROCESSING_STARTED", { videoId });

    await mkdir(tempDir, { recursive: true }); // Create the temporary directory
    await downloadFromS3(video.original_storage_key, sourcePath); // Download the source video from S3

    const metadata = await probeVideo(sourcePath); // Get the metadata of the source video
    await updateVideoMetadata(videoId, metadata); // Update the video metadata in the database
    logger.info("VIDEO_PROBED", { videoId, metadata });

    const targets = getTranscodeTargets(metadata.height); // Get the transcode targets based on the video height

    //this is a for each loop that will transcode the video to each target resolution and upload it to S3
    for (const target of targets) {
      const outputPath = path.join(tempDir, `${target.resolution}.mp4`); // Path to store the transcoded video
      const storageKey = `videos/${videoId}/processed/${target.resolution}/video.mp4`; // S3 storage key for the transcoded video
      logger.info("TRANSCODING_STARTED", { videoId, target: target.resolution }); // Log the start of transcoding for the target resolution
      await transcodeVideo(sourcePath, outputPath, target); // Transcode the video to target resolution
      logger.info("TRANSCODING_COMPLETED", { videoId, target: target.resolution }); // Log the completion of transcoding for the target resolution

      await uploadFileToS3(outputPath, storageKey, "video/mp4"); // Upload the transcoded video to S3
      logger.info("UPLOAD_COMPLETED", { videoId, target: target.resolution, storageKey }); // Log the completion of upload for the target resolution

      await createVideoAsset({
        videoId,
        resolution: target.resolution,
        width: target.width,
        height: target.height,
        videoBitrate: bitrateToNumber(target.videoBitrate),
        audioBitrate: bitrateToNumber(target.audioBitrate),
        format: "mp4",
        storageKey,
      });
    }

    await updateVideoStatus(videoId, "READY"); // Update the video status to READY after processing all targets
    logger.info("PROCESSING_COMPLETED", { videoId }); // Log the completion of processing for the video
  } catch (error) {
    logger.error("PROCESSING_FAILED", { videoId, error });
    await updateVideoStatus(videoId, "FAILED");
  }
};
