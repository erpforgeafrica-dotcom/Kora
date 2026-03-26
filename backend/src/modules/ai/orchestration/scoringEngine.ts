import { queryDb } from "../../../db/client.js";
import { AIClientFactory } from "../../../services/aiClient.js";
import type { ModuleSignalSnapshot, NormalizedCommandCandidate, OrchestrationContext, ScoredAction } from "./types.js";

const severityWeight: Record<NormalizedCommandCandidate["severity"], number> = {
  critical: 1,
  high: 0.78,
  medium: 0.52,
  low: 0.25
};

const roleWeight: Record<string, number> = {
  owner: 1,
  admin: 0.95,
  manager: 0.88,
  operator: 0.75
};

type FeedbackRow = {
  command_fingerprint: string;
  accepted: string;
  total: string;
};

async function loadFeedbackAdjustments(organizationId: string) {
  const rows = await queryDb<FeedbackRow>(
    `select
       command_fingerprint,
       count(*) filter (where outcome in ('accepted','executed'))::text as accepted,
       count(*)::text as total
     from ai_action_feedback
     where organization_id = $1
     group by command_fingerprint`,
    [organizationId]
  );

  const map = new Map<string, number>();
  for (const row of rows) {
    const total = Math.max(1, Number(row.total));
    const accepted = Number(row.accepted);
    const ratio = accepted / total;
    map.set(row.command_fingerprint, (ratio - 0.5) * 12);
  }
  return map;
}

function orgPressureScore(signals: ModuleSignalSnapshot, candidate: NormalizedCommandCandidate) {
  const emergencyPressure = signals.emergency.criticalIncidents > 0 ? 12 : signals.emergency.openIncidents > 0 ? 6 : 0;
  const financePressure = signals.finance.overdueInvoices > 6 ? 7 : signals.finance.overdueInvoices > 0 ? 3 : 0;
  const notificationPressure = signals.notifications.pendingNotifications > 40 ? 4 : 0;

  if (candidate.sourceModule === "emergency") return emergencyPressure + 4;
  if (candidate.sourceModule === "finance") return financePressure + (signals.emergency.openIncidents > 0 ? -3 : 2);
  if (candidate.sourceModule === "notifications") return notificationPressure;
  return emergencyPressure * 0.35 + financePressure * 0.25;
}

function dependencyFactor(candidate: NormalizedCommandCandidate, all: NormalizedCommandCandidate[]) {
  if (!candidate.dependencies.length) return 0;
  const unresolvedCritical = all.some(
    (c) => candidate.dependencies.includes(c.sourceModule) && c.severity === "critical"
  );
  return unresolvedCritical ? -8 : 4;
}

function buildFollowUpChain(candidate: NormalizedCommandCandidate, all: NormalizedCommandCandidate[]) {
  const chain = new Set<string>();
  for (const depModule of candidate.dependencies) {
    const related = all.find((c) => c.sourceModule === depModule);
    if (related) chain.add(`${related.sourceModule}:${related.title}`);
  }
  if (candidate.sourceModule === "emergency") {
    const finance = all.find((c) => c.sourceModule === "finance");
    if (finance) chain.add(`finance:${finance.title}`);
  }
  return [...chain];
}

export interface ScoringResult {
  rankedActions: ScoredAction[];
  hiddenRisk: string | null;
  aiCausalityInsights: string[];
}

export async function scoreCommandCandidates(
  candidates: NormalizedCommandCandidate[],
  context: OrchestrationContext,
  signals: ModuleSignalSnapshot
): Promise<ScoringResult> {
  const roleFactor = roleWeight[context.userRole] ?? roleWeight.operator;
  const feedbackAdjust = await loadFeedbackAdjustments(context.organizationId);

  const scored = candidates.map((candidate) => {
    const sev = severityWeight[candidate.severity] * 55;
    const sla = candidate.slaRisk * 25;
    const role = roleFactor * 8;
    const pressure = orgPressureScore(signals, candidate);
    const dep = dependencyFactor(candidate, candidates);
    const feedback = feedbackAdjust.get(candidate.commandFingerprint) ?? 0;
    const score = Number((sev + sla + role + pressure + dep + feedback).toFixed(2));

    return {
      ...candidate,
      score,
      reasoning: [
        `Severity impact ${(sev / 55).toFixed(2)}`,
        `SLA risk ${candidate.slaRisk.toFixed(2)}`,
        `Role-adjusted multiplier ${roleFactor.toFixed(2)}`,
        `Org pressure contribution ${pressure.toFixed(2)}`,
        `Feedback adaptation ${feedback.toFixed(2)}`
      ],
      followUpChain: buildFollowUpChain(candidate, candidates)
    };
  });

  const ranked = scored.sort((a, b) => b.score - a.score);

  const top = ranked.slice(0, 5);
  try {
    const client = await AIClientFactory.createClient(context.organizationId);
    const aiResult = await client.executeTask({
      organizationId: context.organizationId,
      userId: context.userId,
      taskType: "orchestration_ranking",
      prompt:
        "Re-rank top actions with concise rationale and include hidden risk/causality. Return JSON {ranked:[{id,reason}],hiddenRisk,causalityInsights:[string]}.\n" +
        JSON.stringify({ top, signals }),
      maxTokens: 550
    });
    const parsed = JSON.parse(aiResult.content) as {
      ranked?: Array<{ id: string; reason: string }>;
      hiddenRisk?: string;
      causalityInsights?: string[];
    };
    if (parsed.ranked?.length) {
      const reasonById = new Map(parsed.ranked.map((r) => [r.id, r.reason]));
      ranked.sort((a, b) => {
        const ia = parsed.ranked?.findIndex((r) => r.id === a.id) ?? 999;
        const ib = parsed.ranked?.findIndex((r) => r.id === b.id) ?? 999;
        return ia - ib;
      });
      for (const item of ranked) {
        const reason = reasonById.get(item.id);
        if (reason) item.reasoning.unshift(reason);
      }
    }
    return {
      rankedActions: ranked,
      hiddenRisk: parsed.hiddenRisk ?? null,
      aiCausalityInsights: parsed.causalityInsights ?? []
    };
  } catch {
    return {
      rankedActions: ranked,
      hiddenRisk: null,
      aiCausalityInsights: []
    };
  }
}
