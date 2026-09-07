import { getPool } from "../../../config/database.js";
import type { CreateLiveStreamInput, LiveStream, LiveStreamStatus } from "../../../types/live.js";

interface LiveStreamRow {
  id: string;
  user_id: string | null;
  title: string;
  description: string | null;
  status: LiveStreamStatus;
  signaling_room_id: string;
  started_at: Date | null;
  ended_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

function mapLiveStream(row: LiveStreamRow): LiveStream {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    status: row.status,
    signalingRoomId: row.signaling_room_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createLiveStream(
  input: CreateLiveStreamInput & { signalingRoomId: string },
): Promise<LiveStream> {
  const result = await getPool().query<LiveStreamRow>(
    `
      INSERT INTO live_streams (
        user_id,
        title,
        description,
        status,
        signaling_room_id
      )
      VALUES ($1, $2, $3, 'READY', $4)
      RETURNING *
    `,
    [input.userId ?? null, input.title, input.description ?? null, input.signalingRoomId],
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error("Failed to create live stream");
  }

  return mapLiveStream(row);
}

export async function findLiveStreamById(streamId: string): Promise<LiveStream | null> {
  const result = await getPool().query<LiveStreamRow>(
    `
      SELECT *
      FROM live_streams
      WHERE id = $1
    `,
    [streamId],
  );

  return result.rows[0] ? mapLiveStream(result.rows[0]) : null;
}

export async function updateLiveStreamStatus(
  streamId: string,
  status: LiveStreamStatus,
): Promise<LiveStream | null> {
  const result = await getPool().query<LiveStreamRow>(
    `
      UPDATE live_streams
      SET
        status = $2::live_stream_status,
        started_at = CASE
          WHEN $2::live_stream_status = 'LIVE' AND started_at IS NULL THEN NOW()
          ELSE started_at
        END,
        ended_at = CASE
          WHEN $2::live_stream_status = 'ENDED' THEN NOW()
          ELSE ended_at
        END,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [streamId, status],
  );

  return result.rows[0] ? mapLiveStream(result.rows[0]) : null;
}
