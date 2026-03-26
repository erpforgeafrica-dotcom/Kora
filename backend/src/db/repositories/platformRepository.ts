import { queryDb } from "../client.js";

export async function listTenantHealthRows() {
  return queryDb<{
    org_id: string;
    org_name: string;
    monthly_active_users: string;
    ai_spend_this_month_usd: string;
    ai_budget_utilisation_pct: string;
    last_login: string | null;
  }>(
    `select o.id::text as org_id,
            o.name as org_name,
            count(distinct al.actor_id)::text as monthly_active_users,
            coalesce(ab.current_month_spend_usd, 0)::text as ai_spend_this_month_usd,
            (
              case when coalesce(ab.monthly_limit_usd, 0) = 0 then 0
              else round(coalesce(ab.current_month_spend_usd, 0)::numeric / ab.monthly_limit_usd::numeric * 100, 2)
              end
            )::text as ai_budget_utilisation_pct,
            max(al.created_at)::text as last_login
       from organizations o
       left join audit_logs al on al.organization_id = o.id and al.created_at >= date_trunc('month', now())
       left join ai_budgets ab on ab.organization_id = o.id
      group by o.id, o.name, ab.current_month_spend_usd, ab.monthly_limit_usd
      order by o.name asc`
  );
}

export async function getAiSpendSummaryRows() {
  const [providerRows, orgRows, taskRows] = await Promise.all([
    queryDb<{ provider: string; spend_usd: string }>(
      `select provider, coalesce(sum(cost_usd), 0)::text as spend_usd
         from ai_requests
        group by provider`
    ),
    queryDb<{ org_id: string; org_name: string; spend_usd: string }>(
      `select o.id::text as org_id, o.name as org_name, coalesce(sum(ar.cost_usd), 0)::text as spend_usd
         from organizations o
         left join ai_requests ar on ar.organization_id = o.id
        group by o.id, o.name
        order by coalesce(sum(ar.cost_usd), 0) desc`
    ),
    queryDb<{ task: string; token_count: string; cost_usd: string }>(
      `select coalesce(inference_type, 'unknown') as task,
              coalesce(sum(total_tokens), 0)::text as token_count,
              coalesce(sum(cost_usd), 0)::text as cost_usd
         from ai_requests
        group by inference_type
        order by coalesce(sum(cost_usd), 0) desc
        limit 5`
    )
  ]);

  return { providerRows, orgRows, taskRows };
}

export async function listPlatformBusinesses() {
  return queryDb<{
    org_id: string;
    org_name: string;
    industry: string | null;
    status: string | null;
    created_at: string;
    monthly_active_users: string;
  }>(
    `select o.id::text as org_id,
            o.name as org_name,
            o.industry,
            o.status,
            o.created_at::text,
            count(distinct al.actor_id)::text as monthly_active_users
       from organizations o
       left join audit_logs al on al.organization_id = o.id and al.created_at >= date_trunc('month', now())
      group by o.id, o.name, o.industry, o.status, o.created_at
      order by o.created_at desc`
  );
}

export async function listAuditLogRows(limit: number) {
  return queryDb<{
    id: string;
    organization_id: string | null;
    actor_id: string | null;
    action: string;
    metadata: Record<string, unknown> | null;
    created_at: string;
  }>(
    `select id::text,
            organization_id::text,
            actor_id::text,
            action,
            metadata,
            created_at::text
       from audit_logs
      order by created_at desc
      limit $1`,
    [limit]
  );
}

export async function listPlatformUsers(limit: number) {
  return queryDb<{
    id: string;
    organization_id: string | null;
    branch_id: string | null;
    name: string | null;
    email: string;
    phone: string | null;
    role_id: string | null;
    status: string | null;
    created_at: string;
  }>(
    `select id::text,
            organization_id::text,
            branch_id::text,
            split_part(email, '@', 1) as name,
            email,
            null::text as phone,
            coalesce(role, 'unassigned') as role_id,
            case when locked_until is not null and locked_until > now() then 'suspended' else 'active' end as status,
            created_at::text
       from users
      order by created_at desc
      limit $1`,
    [limit]
  );
}

export async function getPlatformRevenueAnalytics() {
  const [totals, byOrg] = await Promise.all([
    queryDb<{
      completed_revenue: string;
      transaction_count: string;
      average_transaction_value: string;
    }>(
      `select coalesce(sum(amount_cents), 0)::text as completed_revenue,
              count(*)::text as transaction_count,
              coalesce(avg(amount_cents), 0)::text as average_transaction_value
         from transactions
        where status in ('succeeded', 'completed')`
    ),
    queryDb<{
      org_id: string;
      org_name: string;
      completed_revenue: string;
      transaction_count: string;
    }>(
      `select o.id::text as org_id,
              o.name as org_name,
              coalesce(sum(t.amount_cents), 0)::text as completed_revenue,
              count(t.id)::text as transaction_count
         from organizations o
         left join transactions t on t.organization_id = o.id and t.status in ('succeeded', 'completed')
        group by o.id, o.name
        order by completed_revenue::numeric desc`
    )
  ]);

  return {
    totals: totals[0] ?? {
      completed_revenue: "0",
      transaction_count: "0",
      average_transaction_value: "0"
    },
    byOrg
  };
}
