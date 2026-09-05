import { ApiError } from "../../../utils/ApiError.js";
import { findVideoById } from "../../video/repositories/video.repository.js";
import { processVideo } from "../workers/video.worker.js";

export const startVideoProcessing = async (videoId: string) => {
    const video = await findVideoById(videoId);
    if (!video) {
        throw new ApiError(404, "VIDEO_NOT_FOUND", "Video not found");
    }
    if (video.status !== "UPLOADED") {
        throw new ApiError(409, "INVALID_VIDEO_STATUS", "Video is not in UPLOADED status");
    }
    void processVideo(videoId);
    return {
        message: "Processing started",
        videoId,
        status: "PROCESSING",
    }
};
