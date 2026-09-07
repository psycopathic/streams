import type { Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../../../utils/ApiError.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import {
  createStream,
  getPlayback,
  getStream,
  stopStream,
} from "../services/live.service.js";

const createLiveStreamSchema = z.object({
  title: z.string().trim().min(1, "Stream title is required"),
  description: z.string().trim().optional(),
});

const getStreamIdParam = (req: Request) => {
  const streamId = req.params.streamId;
  if (typeof streamId !== "string") {
    throw new ApiError(400, "INVALID_STREAM_ID", "Stream ID must be a string");
  }

  return streamId;
};

export const createLiveStreamController = asyncHandler(async (req: Request, res: Response) => {
  const body = createLiveStreamSchema.parse(req.body);

  const result = await createStream({
    title: body.title,
    ...(body.description === undefined ? {} : { description: body.description }),
  });

  res.status(201).json(result);
});

export const getLiveStreamController = asyncHandler(async (req: Request, res: Response) => {
  const stream = await getStream(getStreamIdParam(req));

  res.status(200).json(stream);
});

export const getLivePlaybackController = asyncHandler(async (req: Request, res: Response) => {
  const playback = await getPlayback(getStreamIdParam(req));

  res.status(200).json(playback);
});

export const stopLiveStreamController = asyncHandler(async (req: Request, res: Response) => {
  const stream = await stopStream(getStreamIdParam(req));

  res.status(200).json(stream);
});
