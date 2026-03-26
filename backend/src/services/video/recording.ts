import { queryDb } from "../../db/client.js";

export async function createRecording(
  organizationId: string,
  payload: {
    session_id: string;
    storage_key: string;
    playback_url?: string | null;
    transcript_text?: string | null;
    duration_seconds?: number | null;
  }
) {
  const [recording] = await queryDb<{
    id: string;
    session_id: string;
    storage_key: string;
    playback_url: string | null;
    transcript_text: string | null;
    duration_seconds: number | null;
    created_at: string;
  }>(
    `INSERT INTO video_recordings (organization_id, session_id, storage_key, playback_url, transcript_text, duration_seconds)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id::text, session_id::text, storage_key, playback_url, transcript_text, duration_seconds, created_at::text`,
    [
      organizationId,
      payload.session_id,
      payload.storage_key,
      payload.playback_url ?? null,
      payload.transcript_text ?? null,
      payload.duration_seconds ?? null
    ]
  );

  return recording;
}

export async function getRecording(organizationId: string, recordingId: string) {
  const [recording] = await queryDb<{
    id: string;
    session_id: string;
    storage_key: string;
    playback_url: string | null;
    transcript_text: string | null;
    quality_score: string | null;
    duration_seconds: number | null;
    created_at: string;
  }>(
    `SELECT id::text, session_id::text, storage_key, playback_url, transcript_text, quality_score::text, duration_seconds, created_at::text
     FROM video_recordings
     WHERE organization_id = $1 AND id = $2
     LIMIT 1`,
    [organizationId, recordingId]
  );

  return recording ?? null;
}
