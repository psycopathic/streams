import { promises } from "node:dns";
import { getPool } from "../../../config/database.js";
import {
  VideoAssetRecord,
  VideoProbeResult,
  VideoRecord,
  VideoStatus,
} from "../../../types/video.js";

export const createVideo = async (data: {
  id: string;
  title: string;
  description?: string | undefined;
  originalFilename: string;
  originalStorageKey: string;
}): Promise<VideoRecord> => {
  const result = await getPool().query(
    `INSERT INTO videos (id, title, description, original_filename, original_storage_key)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [data.id, data.title, data.description || null, data.originalFilename, data.originalStorageKey],
  );
  return result.rows[0];
};

export const updateVideoStatus = async (
  videoId: string,
  status: VideoStatus,
): Promise<VideoRecord | undefined> => {
  const result = await getPool().query(
    `UPDATE videos SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, videoId],
  );
  return result.rows[0];
};

export const findVideoById = async (VideoId: string): Promise<VideoRecord | undefined> => {
  const result = await getPool().query(`SELECT * FROM videos WHERE id = $1`, [VideoId]);
  return result.rows[0];
};

export const getVideoById = findVideoById;

export const updateVideoMetadata = async (
  VideoId: string,
  metadata: VideoProbeResult,
): Promise<VideoRecord | undefined> => {
  const result = await getPool().query(
    `UPDATE videos
     SET duration = $1, width = $2, height = $3, updated_at = NOW()
     WHERE id = $4
     RETURNING *`,
    [metadata.duration, metadata.width, metadata.height, VideoId],
  );
  return result.rows[0];
};

export const createVideoAsset = async (data: {
  videoId: string;
  resolution: string;
  width: number;
  height: number;
  videoBitrate: number | null;
  audioBitrate: number | null;
  format: string;
  storageKey: string;
}): Promise<VideoAssetRecord> => {
  const result = await getPool().query(
    `INSERT INTO video_assets (video_id, resolution, width, height, video_bitrate, audio_bitrate, format, storage_key)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      data.videoId,
      data.resolution,
      data.width,
      data.height,
      data.videoBitrate,
      data.audioBitrate,
      data.format,
      data.storageKey,
    ],
  );
  return result.rows[0];
};

export const findVideoAssets = async (videoId: string): Promise<VideoAssetRecord[]> => {
  const result = await getPool().query(`SELECT * FROM video_assets WHERE video_id = $1 ORDER BY height ASC`, [videoId]);
  return result.rows;
};