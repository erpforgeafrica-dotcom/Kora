import { queryDb } from "../../db/client.js";

export async function scoreRecordingQuality(organizationId: string, recordingId: string, qualityScore: number) {
  await queryDb(
    `UPDATE video_recordings
        SET quality_score = $3
      WHERE organization_id = $1 AND id = $2`,
    [organizationId, recordingId, qualityScore]
  );

  return { recording_id: recordingId, quality_score: qualityScore };
}

export async function getSessionAnalytics(organizationId: string, sessionId: string) {
  const [summary] = await queryDb<{
    recordings: string;
    avg_quality_score: string | null;
    total_duration_seconds: string | null;
  }>(
    `SELECT COUNT(*) AS recordings,
            AVG(quality_score)::text AS avg_quality_score,
            SUM(duration_seconds)::text AS total_duration_seconds
     FROM video_recordings vr
     JOIN video_sessions vs ON vs.id = vr.session_id
     WHERE vs.organization_id = $1 AND vs.id = $2`,
    [organizationId, sessionId]
  );

  return {
    session_id: sessionId,
    recordings: Number(summary?.recordings ?? 0),
    avg_quality_score: Number(summary?.avg_quality_score ?? 0),
    total_duration_seconds: Number(summary?.total_duration_seconds ?? 0)
  };
}
