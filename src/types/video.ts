import { z } from "zod";

export const VIDEO_STATUS = ["UPLOADING", "UPLOADED", "PROCESSING", "READY", "FAILED"] as const;
export type VideoStatus = (typeof VIDEO_STATUS)[number];

export const SUPPORTED_VIDEO_CONTENT_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

export const initializeUploadSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().max(5000).optional(),
  filename: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .regex(/^[^/\\]+$/, "filename must not contain path separators"),
  contentType: z.enum(SUPPORTED_VIDEO_CONTENT_TYPES),
});


export type InitializeUploadRequest = z.infer<typeof initializeUploadSchema>;


export interface VideoRecord {
  id: string;
  title: string;
  description: string | null;
  original_filename: string;
  original_storage_key: string;
  status: VideoStatus;
  duration: string | number | null;
  width: number | null;
  height: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface VideoAssetRecord {
  id: string;
  video_id: string;
  resolution: string;
  width: number;
  height: number;
  video_bitrate: number | null;
  audio_bitrate: number | null;
  format: string;
  storage_key: string;
  created_at: Date;
}

export interface VideoProbeResult {
  duration: number | null;
  width: number | null;
  height: number | null;
  videoCodec: string | null;
  audioCodec: string | null;
  videoBitrate: number | null;
  audioBitrate: number | null;
  format: string | null;
}

export interface TranscodeTarget {
  resolution: string;
  width: number;
  height: number;
  videoBitrate: string;
  audioBitrate: string;
}
