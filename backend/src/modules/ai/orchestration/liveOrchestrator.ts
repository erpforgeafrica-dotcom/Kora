import { queryDb } from "../../../db/client.js";
import { logger } from "../../../shared/logger.js";
import { aggregateCommandSignals } from "./signalAggregator.js";
import { scoreCommandCandidates } from "./scoringEngine.js";
import { executeAutonomousPolicies, type PolicyOutcome } from "./workflowPolicies.js";
import type { CausalityInsight, OrchestrationContext, ScoredAction } from "./types.js";

export interface LiveOrchestrationResult {
  generatedAt: string;
  prioritizedActions: ScoredAction[];
  policyOutcomes: PolicyOutcome[];
  nextActionRecommendation: string | null;
  causalityInsights: CausalityInsight[];
  hiddenRisk: string | null;
  aiCausalityInsights: string[];
}

async function applyFeedbackAdjustments(organizationId: string, actions: ScoredAction[]) {
  const feedbackVolumeRows = await queryDb<{ total: string }>(
    `select count(*)::text as total from ai_action_feedback where organization_id = $1`,
    [organizationId]
  );
  const totalFeedback = Number(feedbackVolumeRows[0]?.total ?? 0);
  if (totalFeedback < 20) return actions;

  const rows = await queryDb<{ command_fingerprint: string; accepted: string; total: string }>(
    `select command_fingerprint,
            count(*) filter (where outcome in ('accepted','executed'))::text as accepted,
            count(*)::text as total
      from ai_action_feedback
      where organization_id = $1
      group by command_fingerprint`,
    [organizationId]
  );

  const rateByFingerprint = new Map(rows.map((r) => [r.command_fingerprint, Number(r.accepted) / Math.max(1, Number(r.total))]));
  const adjusted = actions.map((action) => {
    const rate = rateByFingerprint.get(action.commandFingerprint);
    if (rate == null) return action;
    let delta = 0;
    if (rate < 0.25) delta = -12;
    else if (rate > 0.8) delta = 10;
    if (delta !== 0) {
      queryDb(
        `insert into audit_logs (id, organization_id, actor_id, action, metadata, created_at)
         values (gen_random_uuid(), $1, null, 'feedback_adjustment', $2::jsonb, now())`,
        [organizationId, JSON.stringify({ commandFingerprint: action.commandFingerprint, acceptanceRate: rate, delta })]
      ).catch(() => null);
    }
    return { ...action, score: Number((action.score + delta).toFixed(2)) };
  });
  return adjusted.sort((a, b) => b.score - a.score);
}

export async function runLiveOrchestration(input: {
  context: OrchestrationContext;
  topN: number;
  autoExecute: boolean;
}): Promise<LiveOrchestrationResult> {
  const { context, topN, autoExecute } = input;
  const { signals, candidates, causalityInsights } = await aggregateCommandSignals(context.organizationId);
  const scoring = await scoreCommandCandidates(candidates, context, signals);
  const feedbackAdjusted = await applyFeedbackAdjustments(context.organizationId, scoring.rankedActions);
  const prioritizedActions = feedbackAdjusted.slice(0, Math.max(1, topN));

  const policyOutcomes = await executeAutonomousPolicies({
    organizationId: context.organizationId,
    userId: context.userId,
    scoredActions: prioritizedActions,
    signals,
    autoExecute
  });

  await queryDb(
    `insert into ai_orchestration_events (
       id, organization_id, user_id, context, snapshot, prioritized_actions, policy_outcomes, created_at
     ) values (
       gen_random_uuid(), $1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6::jsonb, now()
     )`,
    [
      context.organizationId,
      context.userId,
      JSON.stringify({ userRole: context.userRole }),
      JSON.stringify(signals),
      JSON.stringify(prioritizedActions),
      JSON.stringify(policyOutcomes)
    ]
  );

  const nextActionRecommendation = prioritizedActions[0]
    ? `${prioritizedActions[0].sourceModule.toUpperCase()}: ${prioritizedActions[0].title}`
    : null;

  logger.info("Live orchestration generated", {
    organizationId: context.organizationId,
    actions: prioritizedActions.length,
    policyTriggered: policyOutcomes.filter((p) => p.triggered).length
  });

  return {
    generatedAt: new Date().toISOString(),
    prioritizedActions,
    policyOutcomes,
    nextActionRecommendation,
    causalityInsights,
    hiddenRisk: scoring.hiddenRisk,
    aiCausalityInsights: scoring.aiCausalityInsights
  };
}

export async function saveActionFeedback(input: {
  organizationId: string;
  userId: string;
  actionId: string;
  commandFingerprint: string;
  outcome: "accepted" | "rejected" | "executed" | "ignored";
  feedbackScore?: number;
  notes?: string;
}) {
  const feedbackScore = Math.max(-1, Math.min(1, input.feedbackScore ?? 0));
  await queryDb(
    `insert into ai_action_feedback (
       id, organization_id, user_id, action_id, command_fingerprint, outcome, feedback_score, notes, created_at
     )
     values (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, now())`,
    [
      input.organizationId,
      input.userId,
      input.actionId,
      input.commandFingerprint,
      input.outcome,
      feedbackScore,
      input.notes ?? null
    ]
  );
}
