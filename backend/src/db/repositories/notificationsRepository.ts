import { queryDb } from "../client.js";

export async function createNotificationLogRecord(params: {
  organizationId: string;
  clientId?: string | null;
  channel: string;
  event: string;
  recipient: string;
  payload: Record<string, unknown>;
}) {
  const rows = await queryDb<{ id: string }>(
    `insert into notification_log (
       id, organization_id, client_id, channel, event, recipient, status, payload
     ) values (
       gen_random_uuid(), $1, $2, $3, $4, $5, 'queued', $6::jsonb
     )
     returning id::text`,
    [
      params.organizationId,
      params.clientId ?? null,
      params.channel,
      params.event,
      params.recipient,
      JSON.stringify(params.payload)
    ]
  );

  return rows[0] ?? null;
}

export async function listNotificationTemplates(organizationId: string | null) {
  return queryDb<{
    id: string;
    organization_id: string | null;
    event: string;
    channel: string;
    subject: string | null;
    body: string;
    is_active: boolean;
  }>(
    `select id::text, organization_id::text, event, channel, subject, body, is_active
       from notification_templates
      where organization_id is null
         or organization_id = $1
      order by organization_id nulls first, event asc, channel asc`,
    [organizationId]
  );
}

export async function upsertNotificationTemplate(params: {
  organizationId: string;
  event: string;
  channel: string;
  subject?: string | null;
  body: string;
  isActive: boolean;
}) {
  const rows = await queryDb<{ id: string; event: string; channel: string }>(
    `insert into notification_templates (
       id, organization_id, event, channel, subject, body, is_active
     ) values (
       gen_random_uuid(), $1, $2, $3, $4, $5, $6
     )
     on conflict (organization_id, event, channel)
     do update set
       subject = excluded.subject,
       body = excluded.body,
       is_active = excluded.is_active,
       updated_at = now()
     returning id::text, event, channel`,
    [params.organizationId, params.event, params.channel, params.subject ?? null, params.body, params.isActive]
  );

  return rows[0] ?? null;
}

export async function listNotificationLogRecords(organizationId: string, limit: number) {
  return queryDb<{
    id: string;
    client_id: string | null;
    channel: string;
    event: string;
    recipient: string;
    status: string;
    provider_id: string | null;
    sent_at: string | null;
    error: string | null;
    created_at: string;
  }>(
    `select id::text,
            client_id::text,
            channel,
            event,
            recipient,
            status,
            provider_id,
            sent_at::text,
            error,
            created_at::text
       from notification_log
      where organization_id = $1
      order by created_at desc
      limit $2`,
    [organizationId, limit]
  );
}
