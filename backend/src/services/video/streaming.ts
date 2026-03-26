import { queryDb } from "../../db/client.js";

export async function scheduleVideoSession(
  organizationId: string,
  userId: string | null,
  payload: { booking_id?: string | null; provider?: string | null; starts_at?: string | null }
) {
  const roomName = `kora-${organizationId.slice(0, 8)}-${Date.now()}`;
  const [session] = await queryDb<{
    id: string;
    booking_id: string | null;
    provider: string;
    room_name: string;
    status: string;
    starts_at: string | null;
    created_at: string;
  }>(
    `INSERT INTO video_sessions (organization_id, booking_id, provider, room_name, status, starts_at, created_by)
     VALUES ($1, $2, $3, $4, 'scheduled', $5, $6)
     RETURNING id::text, booking_id::text, provider, room_name, status, starts_at::text, created_at::text`,
    [organizationId, payload.booking_id ?? null, payload.provider ?? "twilio", roomName, payload.starts_at ?? null, userId]
  );

  return {
    ...session,
    join_url: `https://video.kora.local/room/${roomName}`,
    host_token: `host_${session.id}`,
    participant_token: `guest_${session.id}`
  };
}

export async function getVideoSession(organizationId: string, sessionId: string) {
  const [session] = await queryDb<{
    id: string;
    booking_id: string | null;
    provider: string;
    room_name: string;
    status: string;
    starts_at: string | null;
    ends_at: string | null;
    created_at: string;
  }>(
    `SELECT id::text, booking_id::text, provider, room_name, status, starts_at::text, ends_at::text, created_at::text
     FROM video_sessions
     WHERE organization_id = $1 AND id = $2
     LIMIT 1`,
    [organizationId, sessionId]
  );

  if (!session) return null;
  return {
    ...session,
    join_url: `https://video.kora.local/room/${session.room_name}`
  };
}
