CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  original_filename VARCHAR(255) NOT NULL,
  original_storage_key TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'UPLOADING',
  duration NUMERIC,
  width INT,
  height INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_videos_status
    CHECK (status IN ('UPLOADING', 'UPLOADED', 'PROCESSING', 'READY', 'FAILED'))
);

CREATE TABLE IF NOT EXISTS video_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL,
  resolution VARCHAR(20) NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  video_bitrate INTEGER,
  audio_bitrate INTEGER,
  format VARCHAR(20) NOT NULL,
  storage_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_video_assets_video
    FOREIGN KEY (video_id)
    REFERENCES videos(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_video_assets_video_id ON video_assets(video_id);
