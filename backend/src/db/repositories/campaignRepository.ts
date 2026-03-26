import { queryDb } from "../client.js";

export async function createCampaignRecord(params: {
  organizationId: string;
  name: string;
  channel: string;
  subject?: string | null;
  body: string;
  audience: Record<string, unknown>;
  sendAt?: string | null;
  createdBy?: string | null;
}) {
  const rows = await queryDb<{ id: string; status: string; created_at: string }>(
    `insert into campaigns (
       id, organization_id, name, channel, subject, body, audience, send_at, created_by
     ) values (
       gen_random_uuid(), $1, $2, $3, $4, $5, $6::jsonb, $7::timestamptz, $8
     )
     returning id::text, status, created_at::text`,
    [
      params.organizationId,
      params.name,
      params.channel,
      params.subject ?? null,
      params.body,
      JSON.stringify(params.audience),
      params.sendAt ?? null,
      params.createdBy ?? null
    ]
  );

  return rows[0] ?? null;
}

export async function listCampaignRecords(organizationId: string) {
  return queryDb<{
    id: string;
    name: string;
    channel: string;
    status: string;
    sent_count: number;
    open_count: number;
    created_at: string;
  }>(
    `select id::text, name, channel, status, sent_count, open_count, created_at::text
       from campaigns
      where organization_id = $1
      order by created_at desc`,
    [organizationId]
  );
}

export async function markCampaignScheduled(campaignId: string, organizationId: string) {
  await queryDb(
    `update campaigns
        set status = 'scheduled',
            updated_at = now()
      where id = $1 and organization_id = $2`,
    [campaignId, organizationId]
  );
}

export async function getCampaignStats(campaignId: string, organizationId: string) {
  const rows = await queryDb<{
    id: string;
    name: string;
    status: string;
    sent_count: number;
    open_count: number;
    created_at: string;
  }>(
    `select id::text, name, status, sent_count, open_count, created_at::text
       from campaigns
      where id = $1 and organization_id = $2
      limit 1`,
    [campaignId, organizationId]
  );

  return rows[0] ?? null;
}
