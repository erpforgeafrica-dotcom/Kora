import { queryDb } from "../../db/client.js";

export function getCanvaAuthorizationUrl(state: string) {
  const clientId = process.env.CANVA_CLIENT_ID ?? "canva-client-id";
  const redirectUri = encodeURIComponent(process.env.CANVA_REDIRECT_URI ?? "http://localhost:3000/api/canva/callback");
  return `https://www.canva.com/api/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${encodeURIComponent(state)}`;
}

export async function storeCanvaConnection(
  organizationId: string,
  userId: string | null,
  payload: { canva_user_id: string; access_token: string; refresh_token?: string | null; token_expires_at?: string | null }
) {
  const [connection] = await queryDb<{
    id: string;
    canva_user_id: string;
    token_expires_at: string | null;
    created_at: string;
  }>(
    `INSERT INTO canva_connections (organization_id, user_id, canva_user_id, access_token, refresh_token, token_expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (organization_id, canva_user_id)
     DO UPDATE SET access_token = EXCLUDED.access_token,
                   refresh_token = EXCLUDED.refresh_token,
                   token_expires_at = EXCLUDED.token_expires_at
     RETURNING id::text, canva_user_id, token_expires_at::text, created_at::text`,
    [
      organizationId,
      userId,
      payload.canva_user_id,
      payload.access_token,
      payload.refresh_token ?? null,
      payload.token_expires_at ?? null
    ]
  );

  return connection;
}
