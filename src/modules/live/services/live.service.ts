import crypto from "node:crypto";
import { ERROR_CODES } from "../../../constants/index.js";
import { env } from "../../../config/env.js";
import { ApiError } from "../../../utils/ApiError.js";
import type { CreateLiveStreamInput, LivePlaybackResponse } from "../../../types/live.js";
import {
  createLiveStream,
  findLiveStreamById,
  updateLiveStreamStatus,
} from "../repositories/live.repository.js";

function createSignalingRoomId(): string {
  return `stream_${crypto.randomUUID()}`;
}

export async function createStream(input: CreateLiveStreamInput) {
  if (!input.title?.trim()) {
    throw new ApiError(400, ERROR_CODES.VALIDATION_ERROR, "Stream title is required");
  }

  const stream = await createLiveStream({
    title: input.title.trim(),
    signalingRoomId: createSignalingRoomId(),
    ...(input.userId === undefined ? {} : { userId: input.userId }),
    ...(input.description === undefined ? {} : { description: input.description.trim() }),
  });

  return {
    stream,
    type: "webrtc" as const,
    signalingUrl: env.WEBRTC_SIGNALING_URL,
  };
}

export async function getStream(streamId: string) {
  const stream = await findLiveStreamById(streamId);

  if (!stream) {
    throw new ApiError(404, ERROR_CODES.RESOURCE_NOT_FOUND, "Live stream not found");
  }

  return stream;
}

export async function getPlayback(streamId: string): Promise<LivePlaybackResponse> {
  const stream = await findLiveStreamById(streamId);

  if (!stream) {
    throw new ApiError(404, ERROR_CODES.RESOURCE_NOT_FOUND, "Live stream not found");
  }

  if (stream.status !== "LIVE") {
    throw new ApiError(409, "INVALID_STREAM_STATUS", "Stream is not live");
  }

  return {
    streamId: stream.id,
    status: stream.status,
    type: "webrtc",
    signalingUrl: env.WEBRTC_SIGNALING_URL,
  };
}

export async function markStreamLive(streamId: string) {
  const stream = await findLiveStreamById(streamId);

  if (!stream) {
    throw new ApiError(404, ERROR_CODES.RESOURCE_NOT_FOUND, "Live stream not found");
  }

  if (stream.status === "ENDED") {
    throw new ApiError(409, "INVALID_STREAM_STATUS", "Stream already ended");
  }

  return updateLiveStreamStatus(stream.id, "LIVE");
}

export async function stopStream(streamId: string) {
  const stream = await findLiveStreamById(streamId);

  if (!stream) {
    throw new ApiError(404, ERROR_CODES.RESOURCE_NOT_FOUND, "Live stream not found");
  }

  if (stream.status === "ENDED") {
    throw new ApiError(409, "INVALID_STREAM_STATUS", "Stream already ended");
  }

  return updateLiveStreamStatus(stream.id, "ENDED");
}
