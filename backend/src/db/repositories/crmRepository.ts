import { queryDb } from "../client.js";

export async function listCustomerRanks(organizationId: string) {
  return queryDb<{
    id: string;
    organization_id: string;
    name: string;
    points_threshold: number;
    benefits: unknown;
    created_at: string;
  }>(
    `select id::text,
            organization_id::text,
            name,
            points_threshold,
            benefits,
            created_at::text
       from customer_ranks
      where organization_id = $1
      order by points_threshold asc, name asc`,
    [organizationId]
  );
}

export async function createCustomerRank(params: {
  organizationId: string;
  name: string;
  pointsThreshold: number;
  benefits: unknown;
}) {
  const rows = await queryDb<{
    id: string;
    organization_id: string;
    name: string;
    points_threshold: number;
    benefits: unknown;
    created_at: string;
  }>(
    `insert into customer_ranks (
       id, organization_id, name, points_threshold, benefits
     ) values (
       gen_random_uuid(), $1, $2, $3, $4::jsonb
     )
     returning id::text,
               organization_id::text,
               name,
               points_threshold,
               benefits,
               created_at::text`,
    [params.organizationId, params.name, params.pointsThreshold, JSON.stringify(params.benefits)]
  );

  return rows[0] ?? null;
}

export async function listLoyaltyAccounts(organizationId: string) {
  return queryDb<{
    id: string;
    organization_id: string;
    client_id: string;
    customer_name: string;
    points_balance: number;
    tier_id: string | null;
    created_at: string;
    updated_at: string;
  }>(
    `select la.id::text,
            la.organization_id::text,
            la.client_id::text,
            c.full_name as customer_name,
            la.points_balance,
            la.tier_id::text,
            la.created_at::text,
            la.updated_at::text
       from loyalty_accounts la
       join clients c on c.id = la.client_id
      where la.organization_id = $1
      order by la.updated_at desc`,
    [organizationId]
  );
}

export async function listLeads(organizationId: string) {
  return queryDb<{
    id: string;
    organization_id: string;
    name: string;
    phone: string | null;
    email: string | null;
    source: string | null;
    status: string;
    created_at: string;
  }>(
    `select id::text,
            organization_id::text,
            name,
            phone,
            email,
            source,
            status,
            created_at::text
       from leads
      where organization_id = $1
      order by created_at desc`,
    [organizationId]
  );
}

export async function createLead(params: {
  organizationId: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  source?: string | null;
  status?: string | null;
}) {
  const rows = await queryDb<{
    id: string;
    organization_id: string;
    name: string;
    phone: string | null;
    email: string | null;
    source: string | null;
    status: string;
    created_at: string;
  }>(
    `insert into leads (
       id, organization_id, name, phone, email, source, status
     ) values (
       gen_random_uuid(), $1, $2, $3, $4, $5, $6
     )
     returning id::text,
               organization_id::text,
               name,
               phone,
               email,
               source,
               status,
               created_at::text`,
    [params.organizationId, params.name, params.phone ?? null, params.email ?? null, params.source ?? null, params.status ?? "new"]
  );

  return rows[0] ?? null;
}

export async function listOpportunities(organizationId: string) {
  return queryDb<{
    id: string;
    organization_id: string;
    lead_id: string;
    lead_name: string;
    value: string;
    stage: string;
    expected_close_date: string | null;
    created_at: string;
  }>(
    `select o.id::text,
            o.organization_id::text,
            o.lead_id::text,
            l.name as lead_name,
            o.value::text,
            o.stage,
            o.expected_close_date::text,
            o.created_at::text
       from opportunities o
       join leads l on l.id = o.lead_id
      where o.organization_id = $1
      order by o.created_at desc`,
    [organizationId]
  );
}

export async function createOpportunity(params: {
  organizationId: string;
  leadId: string;
  value: number;
  stage: string;
  expectedCloseDate?: string | null;
}) {
  const rows = await queryDb<{
    id: string;
    organization_id: string;
    lead_id: string;
    value: string;
    stage: string;
    expected_close_date: string | null;
    created_at: string;
  }>(
    `insert into opportunities (
       id, organization_id, lead_id, value, stage, expected_close_date
     ) values (
       gen_random_uuid(), $1, $2, $3, $4, $5::date
     )
     returning id::text,
               organization_id::text,
               lead_id::text,
               value::text,
               stage,
               expected_close_date::text,
               created_at::text`,
    [params.organizationId, params.leadId, params.value, params.stage, params.expectedCloseDate ?? null]
  );

  return rows[0] ?? null;
}
