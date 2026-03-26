import { queryDb } from "../../db/client.js";
import type { RequestUser } from "../../shared/types.js";

export async function listLeads(orgId: string) {
  return queryDb(`select * from crm_leads where organization_id = $1 order by created_at desc limit 200`, [orgId]);
}

export async function createLead(orgId: string, payload: any, user?: RequestUser) {
  const rows = await queryDb(
    `insert into crm_leads (organization_id, status, source, full_name, email, phone, owner_id, score, notes)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     returning *`,
    [
      orgId,
      payload.status ?? "new",
      payload.source ?? null,
      payload.full_name,
      payload.email ?? null,
      payload.phone ?? null,
      user?.userId ?? payload.owner_id ?? null,
      payload.score ?? null,
      payload.notes ?? null
    ]
  );
  return rows[0];
}

export async function updateLead(orgId: string, id: string, payload: any) {
  const fields: string[] = [];
  const values: any[] = [];
  const add = (col: string, val: any) => { values.push(val); fields.push(`${col} = $${values.length}`); };
  for (const key of ["status","source","full_name","email","phone","owner_id","score","notes","converted_contact_id"]) {
    if (payload[key] !== undefined) add(key, payload[key]);
  }
  if (!fields.length) return await getLead(orgId, id);
  values.push(orgId, id);
  const rows = await queryDb(
    `update crm_leads set ${fields.join(", ")}, updated_at = now()
      where organization_id = $${values.length-1} and id = $${values.length}
      returning *`,
    values
  );
  return rows[0];
}

export async function getLead(orgId: string, id: string) {
  const rows = await queryDb(`select * from crm_leads where organization_id = $1 and id = $2 limit 1`, [orgId, id]);
  return rows[0] ?? null;
}

export async function convertLead(orgId: string, id: string) {
  const lead = await getLead(orgId, id);
  if (!lead) return null;
  const contactRows = await queryDb(
    `insert into crm_contacts (organization_id, full_name, email, phone)
     values ($1,$2,$3,$4) returning id::text`,
    [orgId, lead.full_name, lead.email, lead.phone]
  );
  const contactId = contactRows[0].id;
  await queryDb(
    `update crm_leads set status='converted', converted_contact_id=$3, updated_at=now()
      where organization_id=$1 and id=$2`,
    [orgId, id, contactId]
  );
  return { converted_contact_id: contactId };
}

export async function listDeals(orgId: string) {
  return queryDb(`select * from crm_deals where organization_id = $1 order by created_at desc limit 200`, [orgId]);
}

export async function createDeal(orgId: string, payload: any, user?: RequestUser) {
  const rows = await queryDb(
    `insert into crm_deals (
       organization_id, contact_id, account_id, title, stage, value_cents, currency, probability, close_date, owner_id
     ) values (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
     ) returning *`,
    [
      orgId,
      payload.contact_id ?? null,
      payload.account_id ?? null,
      payload.title,
      payload.stage ?? "prospecting",
      payload.value_cents ?? null,
      payload.currency ?? "usd",
      payload.probability ?? null,
      payload.close_date ?? null,
      user?.userId ?? payload.owner_id ?? null
    ]
  );
  return rows[0];
}

export async function updateDeal(orgId: string, id: string, payload: any) {
  const fields: string[] = [];
  const values: any[] = [];
  const add = (col: string, val: any) => { values.push(val); fields.push(`${col} = $${values.length}`); };
  for (const key of ["contact_id","account_id","title","stage","value_cents","currency","probability","close_date","owner_id"]) {
    if (payload[key] !== undefined) add(key, payload[key]);
  }
  if (!fields.length) return await getDeal(orgId, id);
  values.push(orgId, id);
  const rows = await queryDb(
    `update crm_deals set ${fields.join(", ")}, updated_at = now()
      where organization_id = $${values.length-1} and id = $${values.length}
      returning *`,
    values
  );
  return rows[0];
}

export async function getDeal(orgId: string, id: string) {
  const rows = await queryDb(`select * from crm_deals where organization_id = $1 and id = $2 limit 1`, [orgId, id]);
  return rows[0] ?? null;
}

export async function listActivities(orgId: string) {
  return queryDb(
    `select * from crm_activities where organization_id = $1 order by coalesce(due_at, created_at) desc limit 200`,
    [orgId]
  );
}

export async function createActivity(orgId: string, payload: any, user?: RequestUser) {
  const rows = await queryDb(
    `insert into crm_activities (
       organization_id, lead_id, contact_id, deal_id, activity_type, subject, due_at, owner_id, notes
     ) values (
       $1,$2,$3,$4,$5,$6,$7,$8,$9
     ) returning *`,
    [
      orgId,
      payload.lead_id ?? null,
      payload.contact_id ?? null,
      payload.deal_id ?? null,
      payload.activity_type,
      payload.subject,
      payload.due_at ?? null,
      user?.userId ?? payload.owner_id ?? null,
      payload.notes ?? null
    ]
  );
  return rows[0];
}

export async function completeActivity(orgId: string, id: string) {
  const rows = await queryDb(
    `update crm_activities set completed_at = now(), updated_at = now()
      where organization_id = $1 and id = $2
      returning *`,
    [orgId, id]
  );
  return rows[0];
}

/**
 * Qualify lead (score + status update, AI hook ready)
 */
export async function qualifyLead(orgId: string, leadId: string, score: number, notes?: string) {
  const rows = await queryDb(
    `UPDATE crm_leads 
     SET status = CASE WHEN score >= 70 THEN 'qualified' ELSE 'contacted' END,
         score = $3,
         notes = coalesce($4, notes)
     WHERE organization_id = $1 AND id = $2
     RETURNING *`,
    [orgId, leadId, score, notes]
  );
  if (!rows[0]) throw new Error('lead_not_found');
  // Trigger activity creation
  await createActivity(orgId, { lead_id: leadId, activity_type: 'qualification', subject: `Qualified: score ${score}` });
  return rows[0];
}

/**
 * Convert lead to contact + deal (workflow step)
 */
export async function convertToContact(orgId: string, leadId: string, accountId?: string) {
  const lead = await getLead(orgId, leadId);
  if (!lead || lead.status !== 'qualified') throw new Error('lead_not_ready_for_conversion');
  
  const contactRows = await queryDb(
    `INSERT INTO crm_contacts (organization_id, account_id, full_name, email, phone)
     VALUES ($1, $2, $3, $4, $5) RETURNING id::text`,
    [orgId, accountId, lead.full_name, lead.email, lead.phone]
  );
  const contact = contactRows[0];
  
  await queryDb(
    `UPDATE crm_leads SET status = 'converted', converted_contact_id = $3 WHERE organization_id = $1 AND id = $2`,
    [orgId, leadId, contact.id]
  );
  
  // Auto-create deal
  const deal = await createDeal(orgId, {
    contact_id: contact.id,
    account_id: accountId,
    title: `${lead.full_name} - Converted Lead`,
    stage: 'qualification'
  });
  
  return { contact, deal };
}

/**
 * Pipeline stages aggregation (reporting)
 */
export async function getPipelineStages(orgId: string) {
  return queryDb(
    `SELECT stage, count(*) as count, avg(value_cents) as avg_value
     FROM crm_deals WHERE organization_id = $1
     GROUP BY stage ORDER BY count DESC`,
    [orgId]
  );
}

