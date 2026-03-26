import { Router } from "express";
import { getTenantById } from "../../db/repositories/tenantRepository.js";
import { queryDb } from "../../db/client.js";
import { AIClientFactory } from "../../services/aiClient.js";
import { withStaffProfileAlias, withTenantAlias } from "../../shared/blueprintAliases.js";
import { getCachedJson, setCachedJson } from "../../shared/cache.js";
import { getRequiredOrganizationId } from "../../shared/http.js";
import { respondError, respondList, respondSuccess } from "../../shared/response.js";

export const analyticsRoutes = Router();

analyticsRoutes.get("/business-summary", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);  // ✅ JWT-only org context
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const cacheKey = `analytics:business-summary:${organizationId}`;
    const cached = await getCachedJson(cacheKey);
    if (cached) return respondSuccess(res, cached);

    const [revenueRows, bookingRows, staffRows, clientRows, aiAlertRows] = await Promise.all([
      queryDb<{ today: string; this_week: string; this_month: string; last_month: string }>(
        `select
            coalesce(sum(amount_cents) filter (where created_at::date = current_date), 0)::text as today,
            coalesce(sum(amount_cents) filter (where created_at >= date_trunc('week', now())), 0)::text as this_week,
            coalesce(sum(amount_cents) filter (where created_at >= date_trunc('month', now())), 0)::text as this_month,
            coalesce(sum(amount_cents) filter (
              where created_at >= date_trunc('month', now()) - interval '1 month'
                and created_at < date_trunc('month', now())
            ), 0)::text as last_month
           from invoices
          where organization_id = $1 and status = 'paid'`,
        [organizationId]
      ),
      queryDb<{ today_total: string; no_show_rate_pct: string; cancellation_rate_pct: string; avg_booking_value: string }>(
        `select
            count(*) filter (where start_time::date = current_date)::text as today_total,
            (
              case when count(*) = 0 then 0
              else round(count(*) filter (where status = 'no_show')::numeric / count(*)::numeric * 100, 2)
              end
            )::text as no_show_rate_pct,
            (
              case when count(*) = 0 then 0
              else round(count(*) filter (where status = 'cancelled')::numeric / count(*)::numeric * 100, 2)
              end
            )::text as cancellation_rate_pct,
            coalesce(avg(i.amount_cents), 0)::text as avg_booking_value
           from bookings b
           left join invoices i on i.organization_id = b.organization_id and i.client_id = b.client_id
          where b.organization_id = $1`,
        [organizationId]
      ),
      queryDb<{ utilisation_rate_pct: string; top_performer_id: string | null; understaffed_slots: string }>(
        `with staff_load as (
           select sm.id,
                  coalesce(sum(s.duration_minutes), 0) as booked_minutes,
                  greatest(
                    1,
                    coalesce(
                      (
                        select sum((slot->>'end_minutes')::int - (slot->>'start_minutes')::int)
                          from jsonb_array_elements(
                            case jsonb_typeof(sm.availability)
                              when 'array' then sm.availability
                              else '[]'::jsonb
                            end
                          ) slot
                      ), 2400
                    )
                  ) as available_minutes
             from staff_members sm
             left join bookings b on b.staff_member_id = sm.id
               and b.organization_id = sm.organization_id
               and b.start_time >= date_trunc('week', now())
             left join services s on s.id = b.service_id
            where sm.organization_id = $1 and sm.is_active = true
            group by sm.id, sm.availability
         )
         select
           coalesce(round(avg(booked_minutes::numeric / available_minutes::numeric * 100), 2), 0)::text as utilisation_rate_pct,
           (
             select id::text
               from staff_load
              order by booked_minutes desc, id asc
              limit 1
           ) as top_performer_id,
           (
             select count(*)::text
               from staff_load
              where booked_minutes::numeric / available_minutes::numeric < 0.5
           ) as understaffed_slots
         from staff_load`,
        [organizationId]
      ),
      queryDb<{ active_count: string; at_churn_risk: string; new_this_month: string; avg_lifetime_value: string }>(
        `select
            count(*)::text as active_count,
            count(*) filter (where risk_score >= 70)::text as at_churn_risk,
            count(*) filter (where created_at >= date_trunc('month', now()))::text as new_this_month,
            coalesce(avg(client_invoice_totals.total_amount), 0)::text as avg_lifetime_value
           from clients c
           left join (
             select client_id, sum(amount_cents) as total_amount
               from invoices
              where organization_id = $1
              group by client_id
           ) client_invoice_totals on client_invoice_totals.client_id = c.id
          where c.organization_id = $1`,
        [organizationId]
      ),
      queryDb<{
        id: string;
        source_module: string;
        title: string;
        context: string;
        severity: "critical" | "high" | "medium" | "low";
        sla_risk: string;
      }>(
        `select id::text, source_module, title, context, severity, sla_risk::text
           from ai_command_candidates
          where organization_id = $1 and status = 'open'
          order by detected_at desc
          limit 5`,
        [organizationId]
      )
    ]);

    const revenue = revenueRows[0] ?? { today: "0", this_week: "0", this_month: "0", last_month: "0" };
    const lastMonth = Number(revenue.last_month);
    const thisMonth = Number(revenue.this_month);
    const vsLastMonthPct = lastMonth === 0 ? 100 : Number((((thisMonth - lastMonth) / lastMonth) * 100).toFixed(2));

    const tenant = await getTenantById(organizationId);

    return respondSuccess(res, withTenantAlias({
      bookings: {
        today_total: Number(bookingRows[0]?.today_total ?? 0),
        no_show_rate_pct: Number(bookingRows[0]?.no_show_rate_pct ?? 0),
        cancellation_rate_pct: Number(bookingRows[0]?.cancellation_rate_pct ?? 0),
        avg_booking_value: Number(bookingRows[0]?.avg_booking_value ?? 0)
      },
      revenue: {
        today: Number(revenue.today),
        this_week: Number(revenue.this_week),
        this_month: Number(revenue.this_month),
        last_month: Number(revenue.last_month),
        vs_last_month_pct: vsLastMonthPct
      },
      staff: {
        utilisation_rate_pct: Number(staffRows[0]?.utilisation_rate_pct ?? 0),
        top_performer_id: staffRows[0]?.top_performer_id,
        understaffed_slots: Number(staffRows[0]?.understaffed_slots ?? 0)
      },
      clients: {
        active_count: Number(clientRows[0]?.active_count ?? 0),
        at_churn_risk: Number(clientRows[0]?.at_churn_risk ?? 0),
        new_this_month: Number(clientRows[0]?.new_this_month ?? 0),
        avg_lifetime_value: Number(clientRows[0]?.avg_lifetime_value ?? 0)
      },
      customers: {
        active_count: Number(clientRows[0]?.active_count ?? 0),
        at_churn_risk: Number(clientRows[0]?.at_churn_risk ?? 0),
        new_this_month: Number(clientRows[0]?.new_this_month ?? 0),
        avg_lifetime_value: Number(clientRows[0]?.avg_lifetime_value ?? 0)
      },
      ai_alerts: aiAlertRows.map((row, index) => ({
        id: row.id,
        title: row.title,
        severity: row.severity,
        sourceModule: row.source_module as
          | "auth"
          | "bookings"
          | "clinical"
          | "emergency"
          | "finance"
          | "ai"
          | "notifications"
          | "reporting",
        context: row.context,
        rank: index + 1,
        score: Number(row.sla_risk) * 100,
        reasoning: [`SLA risk ${(Number(row.sla_risk) * 100).toFixed(0)}%`, "Derived from open AI command candidates"],
        followUpChain: [`${row.source_module}:Review and assign owner`],
        confidence: 0.74
      }))
      ,
      staff_profiles: {
        utilisation_rate_pct: Number(staffRows[0]?.utilisation_rate_pct ?? 0),
        top_performer_id: staffRows[0]?.top_performer_id,
        understaffed_slots: Number(staffRows[0]?.understaffed_slots ?? 0)
      },
      tenant_summary: tenant
    }, organizationId));
  } catch (error) {
    return next(error);
  }
});

analyticsRoutes.get("/staff-performance/:id", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);  // ✅ JWT-only org context
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const staffId = req.params.id;
    const [statsRows, serviceRows, availabilityRows] = await Promise.all([
      queryDb<{
        bookings_completed: string;
        avg_session_rating: string;
        revenue_generated: string;
        no_show_contribution_pct: string;
        client_retention_rate: string;
      }>(
        `select
            count(*) filter (where b.status = 'completed')::text as bookings_completed,
            coalesce(sm.rating, 0)::text as avg_session_rating,
            coalesce(sum(i.amount_cents), 0)::text as revenue_generated,
            sm.no_show_contribution_count::text as no_show_contribution_pct,
            (
              case when count(distinct b.client_id) = 0 then 0
              else round(count(distinct b.client_id) filter (where b.status = 'completed')::numeric / count(distinct b.client_id)::numeric * 100, 2)
              end
            )::text as client_retention_rate
           from staff_members sm
           left join bookings b on b.staff_member_id = sm.id and b.organization_id = sm.organization_id
           left join invoices i on i.organization_id = b.organization_id and i.client_id = b.client_id
          where sm.organization_id = $1 and sm.id = $2
          group by sm.id`,
        [organizationId, staffId]
      ),
      queryDb<{ name: string }>(
        `select coalesce(s.name, 'Service TBD') as name
           from bookings b
           left join services s on s.id = b.service_id
          where b.organization_id = $1 and b.staff_member_id = $2
          group by s.name
          order by count(*) desc
          limit 5`,
        [organizationId, staffId]
      ),
      queryDb<{ availability: Record<string, unknown> }>(
        `select availability from staff_members where organization_id = $1 and id = $2`,
        [organizationId, staffId]
      )
    ]);

    const stats = statsRows[0];
    if (!stats) {
      return respondError(res, "STAFF_NOT_FOUND", "Staff not found", 404);
    }

    return respondSuccess(res, withStaffProfileAlias(withTenantAlias({
      bookings_completed: Number(stats.bookings_completed),
      avg_session_rating: Number(stats.avg_session_rating),
      revenue_generated: Number(stats.revenue_generated),
      no_show_contribution_pct: Number(stats.no_show_contribution_pct),
      client_retention_rate: Number(stats.client_retention_rate),
      top_services: serviceRows.map((row) => row.name),
      availability_this_week: availabilityRows[0]?.availability ?? {}
    }, organizationId), staffId));
  } catch (error) {
    return next(error);
  }
});

analyticsRoutes.post("/churn-prediction", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);  // ✅ JWT-only org context
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const lookbackDays = Math.min(180, Math.max(30, Number(req.body?.lookback_days ?? 90)));
    const cacheKey = `churn-prediction:${organizationId}:${lookbackDays}`;
    const cached = await getCachedJson<Array<Record<string, unknown>>>(cacheKey);
    if (Array.isArray(cached)) {
      return respondList(req, res, cached, {
        count: cached.length,
        limit: cached.length || 1,
        page: 1,
      });
    }

    const rows = await queryDb<{
      id: string;
      name: string;
      days_since_visit: string;
      visit_count: string;
      outstanding_balance_cents: string;
      risk_score: string | null;
    }>(
      `select c.id::text,
              c.full_name as name,
              coalesce(extract(day from now() - max(b.start_time)), 999)::text as days_since_visit,
              count(b.id)::text as visit_count,
              coalesce(sum(i.amount_cents) filter (where i.status <> 'paid'), 0)::text as outstanding_balance_cents,
              c.risk_score::text
         from clients c
         left join bookings b on b.client_id = c.id and b.organization_id = c.organization_id and b.start_time >= now() - make_interval(days => $2)
         left join invoices i on i.client_id = c.id and i.organization_id = c.organization_id
        where c.organization_id = $1
        group by c.id
        order by max(b.start_time) asc nulls first
        limit 20`,
      [organizationId, lookbackDays]
    );

    let atRiskClients = rows.map((row) => ({
      id: row.id,
      name: row.name,
      days_since_visit: Number(row.days_since_visit),
      predicted_churn_pct: Math.min(
        99,
        Math.max(
          Number(row.risk_score ?? 0),
          Number(row.days_since_visit) > 45 ? 72 : Number(row.days_since_visit) > 30 ? 58 : 26
        )
      ),
      recommended_action:
        Number(row.outstanding_balance_cents) > 0 ? "Send balance reminder with rebooking offer" : "Send personalized re-engagement message"
    }));

    try {
      const aiClient = await AIClientFactory.createClient(organizationId);
      const aiResult = await aiClient.executeTask({
        organizationId,
        userId: res.locals.auth?.userId ?? null,
        taskType: "compliance_advisory",
        prompt:
          "Return JSON { at_risk_clients: [{ id, predicted_churn_pct, recommended_action }] } based on this client behavior dataset: " +
          JSON.stringify(atRiskClients),
        maxTokens: 800
      });
      const parsed = JSON.parse(aiResult.content) as {
        at_risk_clients?: Array<{ id: string; predicted_churn_pct: number; recommended_action: string }>;
      };
      if (Array.isArray(parsed.at_risk_clients)) {
        atRiskClients = atRiskClients.map((client) => {
          const override = parsed.at_risk_clients?.find((item) => item.id === client.id);
          return override
            ? {
                ...client,
                predicted_churn_pct: Number(override.predicted_churn_pct),
                recommended_action: String(override.recommended_action)
              }
            : client;
        });
      }
    } catch {
      // fallback remains heuristic
    }

    const response = atRiskClients
      .filter((client) => client.predicted_churn_pct >= 50)
      .map((client) => withTenantAlias(client, organizationId));
    await setCachedJson(cacheKey, response, 60 * 60 * 4);
    return respondList(req, res, response, {
      count: response.length,
      limit: response.length || 1,
      page: 1,
    });
  } catch (error) {
    return next(error);
  }
});
