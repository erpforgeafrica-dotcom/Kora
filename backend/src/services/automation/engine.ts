import Anthropic from "@anthropic-ai/sdk";
import { queryDb } from "../../db/client.js";

export interface AutomationTemplate {
  key: string;
  name: string;
  trigger_key: string;
  description: string;
  actions: Array<{ type: string; label: string }>;
}

export interface WorkflowPayload {
  name: string;
  trigger_key: string;
  condition_json?: Record<string, unknown>;
  action_json?: Array<Record<string, unknown>>;
  schedule_json?: Record<string, unknown> | null;
  test_mode?: boolean;
  active?: boolean;
}

const TEMPLATES: AutomationTemplate[] = [
  {
    key: "welcome_provider",
    name: "Welcome series for new providers",
    trigger_key: "provider.created",
    description: "Send onboarding steps, compliance reminders, and first-week activation nudges.",
    actions: [{ type: "email", label: "Send welcome email" }, { type: "notify", label: "Create onboarding task" }]
  },
  {
    key: "review_request",
    name: "Review request after service",
    trigger_key: "booking.completed",
    description: "Request a review after a completed service and follow up if no response is received.",
    actions: [{ type: "email", label: "Send review request" }, { type: "notify", label: "Queue SMS reminder" }]
  },
  {
    key: "no_show_follow_up",
    name: "No-show follow-up",
    trigger_key: "booking.no_show",
    description: "Trigger apology or recovery outreach after a missed appointment.",
    actions: [{ type: "notify", label: "Send recovery SMS" }]
  },
  {
    key: "rebooking_incentive",
    name: "Rebooking incentive",
    trigger_key: "booking.completed",
    description: "Offer a timely incentive to drive the next booking within a defined window.",
    actions: [{ type: "email", label: "Send rebooking incentive" }]
  },
  {
    key: "provider_performance_alert",
    name: "Provider performance alert",
    trigger_key: "staff.performance_changed",
    description: "Alert operations when ratings, no-shows, or utilization cross thresholds.",
    actions: [{ type: "notify", label: "Notify manager" }]
  }
];

export function evaluateConditions(
  conditions: Record<string, unknown> | null | undefined,
  context: Record<string, unknown>
): boolean {
  if (!conditions || Object.keys(conditions).length === 0) return true;

  return Object.entries(conditions).every(([key, expected]) => {
    const actual = context[key];
    if (expected && typeof expected === "object" && !Array.isArray(expected)) {
      const operator = String((expected as Record<string, unknown>).operator ?? "eq");
      const value = (expected as Record<string, unknown>).value;
      if (operator === "gte") return Number(actual ?? 0) >= Number(value ?? 0);
      if (operator === "lte") return Number(actual ?? 0) <= Number(value ?? 0);
      if (operator === "includes") return Array.isArray(actual) && actual.includes(value);
      return actual === value;
    }
    return actual === expected;
  });
}

export function computeNextRun(schedule: Record<string, unknown> | null | undefined): string | null {
  if (!schedule?.frequency) return null;
  const now = new Date();
  if (schedule.frequency === "daily") now.setDate(now.getDate() + 1);
  else if (schedule.frequency === "weekly") now.setDate(now.getDate() + 7);
  else now.setHours(now.getHours() + 1);
  return now.toISOString();
}

export async function listAutomationTemplates() {
  return TEMPLATES;
}

export async function listWorkflows(organizationId: string) {
  const rows = await queryDb<{
    id: string;
    name: string;
    trigger_key: string;
    condition_json: Record<string, unknown>;
    action_json: Array<Record<string, unknown>>;
    schedule_json: Record<string, unknown> | null;
    test_mode: boolean;
    active: boolean;
    created_at: string;
    updated_at: string;
  }>(
    `SELECT id::text, name, trigger_key, condition_json, action_json, schedule_json, test_mode, active, created_at::text, updated_at::text
     FROM automation_workflows
     WHERE organization_id = $1
     ORDER BY updated_at DESC`,
    [organizationId]
  );

  return rows.map((row) => ({ ...row, next_run_at: computeNextRun(row.schedule_json) }));
}

export async function createWorkflow(organizationId: string, userId: string | null, payload: WorkflowPayload) {
  const [workflow] = await queryDb<{
    id: string;
    name: string;
    trigger_key: string;
    condition_json: Record<string, unknown>;
    action_json: Array<Record<string, unknown>>;
    schedule_json: Record<string, unknown> | null;
    test_mode: boolean;
    active: boolean;
    created_at: string;
    updated_at: string;
  }>(
    `INSERT INTO automation_workflows (
      organization_id, name, trigger_key, condition_json, action_json, schedule_json, test_mode, active, created_by
    ) VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb, $7, $8, $9)
    RETURNING id::text, name, trigger_key, condition_json, action_json, schedule_json, test_mode, active, created_at::text, updated_at::text`,
    [
      organizationId,
      payload.name,
      payload.trigger_key,
      JSON.stringify(payload.condition_json ?? {}),
      JSON.stringify(payload.action_json ?? []),
      JSON.stringify(payload.schedule_json ?? null),
      payload.test_mode ?? false,
      payload.active ?? true,
      userId
    ]
  );

  return { ...workflow, next_run_at: computeNextRun(workflow.schedule_json) };
}

export async function executeWorkflowTest(organizationId: string, workflowId: string, context: Record<string, unknown>) {
  const [workflow] = await queryDb<{
    id: string;
    name: string;
    trigger_key: string;
    condition_json: Record<string, unknown>;
    action_json: Array<Record<string, unknown>>;
    test_mode: boolean;
  }>(
    `SELECT id::text, name, trigger_key, condition_json, action_json, test_mode
     FROM automation_workflows
     WHERE organization_id = $1 AND id = $2
     LIMIT 1`,
    [organizationId, workflowId]
  );

  if (!workflow) return null;

  const started = Date.now();
  const condition_passed = evaluateConditions(workflow.condition_json, context);
  const output = {
    condition_passed,
    actions_executed: condition_passed ? workflow.action_json : [],
    mode: workflow.test_mode ? "test" : "live_preview"
  };

  await queryDb(
    `INSERT INTO automation_runs (workflow_id, organization_id, trigger_key, status, input_json, output_json, latency_ms)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7)`,
    [
      workflow.id,
      organizationId,
      workflow.trigger_key,
      condition_passed ? "completed" : "skipped",
      JSON.stringify(context),
      JSON.stringify(output),
      Date.now() - started
    ]
  );

  return output;
}

export async function getAutomationAnalytics(organizationId: string) {
  const [summary] = await queryDb<{
    total_workflows: string;
    active_workflows: string;
    total_runs: string;
    average_latency_ms: string | null;
  }>(
    `SELECT
       COUNT(DISTINCT w.id) AS total_workflows,
       COUNT(DISTINCT w.id) FILTER (WHERE w.active) AS active_workflows,
       COUNT(r.id) AS total_runs,
       AVG(r.latency_ms)::text AS average_latency_ms
     FROM automation_workflows w
     LEFT JOIN automation_runs r ON r.workflow_id = w.id
     WHERE w.organization_id = $1`,
    [organizationId]
  );

  return {
    total_workflows: Number(summary?.total_workflows ?? 0),
    active_workflows: Number(summary?.active_workflows ?? 0),
    total_runs: Number(summary?.total_runs ?? 0),
    average_latency_ms: Number(summary?.average_latency_ms ?? 0),
    templates_available: TEMPLATES.length
  };
}

export async function getSmartAutomationSuggestions(organizationId: string, prompt: string) {
  const fallback = {
    suggestions: [
      {
        title: "Review request flow",
        trigger_key: "booking.completed",
        rationale: "High-leverage retention path after fulfilled services.",
        recommended_actions: ["email.review_request", "sms.follow_up"]
      },
      {
        title: "No-show recovery",
        trigger_key: "booking.no_show",
        rationale: "Recover lost revenue with time-bound rebooking incentives.",
        recommended_actions: ["sms.rebook_offer"]
      }
    ],
    source: "heuristic"
  };

  if (!process.env.ANTHROPIC_API_KEY) return fallback;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest",
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content: `Organisation ${organizationId}. Suggest three useful automation rules for this prompt: ${prompt}. Return compact JSON with title, trigger_key, rationale, recommended_actions.`
        }
      ]
    });

    const text = response.content
      .filter((item) => item.type === "text")
      .map((item) => item.text)
      .join("\n");
    return { ...JSON.parse(text), source: "claude" };
  } catch {
    return fallback;
  }
}
