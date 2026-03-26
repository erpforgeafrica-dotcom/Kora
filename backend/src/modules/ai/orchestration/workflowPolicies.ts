import { enqueueNotification, enqueueReportGeneration } from "../../../queues/index.js";
import { logger } from "../../../shared/logger.js";
import { AIClientFactory } from "../../../services/aiClient.js";
import type { ModuleSignalSnapshot, ScoredAction } from "./types.js";

export interface PolicyOutcome {
  policyId: string;
  description: string;
  triggered: boolean;
  executed: boolean;
  details: Record<string, unknown>;
  simulation?: {
    would_have_executed: boolean;
    predicted_outcome: string;
    risk_if_not_executed: string;
    confidence: number;
  };
}

function severityToPriority(severity: string) {
  if (severity === "critical") return "p1";
  if (severity === "high") return "p2";
  if (severity === "medium") return "p3";
  return "p4";
}

export async function executeAutonomousPolicies(input: {
  organizationId: string;
  userId: string;
  scoredActions: ScoredAction[];
  signals: ModuleSignalSnapshot;
  autoExecute: boolean;
}): Promise<PolicyOutcome[]> {
  const { organizationId, userId, scoredActions, signals, autoExecute } = input;
  const outcomes: PolicyOutcome[] = [];

  const emergencyTop = scoredActions.find((a) => a.sourceModule === "emergency" && a.severity === "critical");
  const financeAction = scoredActions.find((a) => a.sourceModule === "finance");

  if (emergencyTop && signals.finance.overdueInvoices > 0) {
  const policy: PolicyOutcome = {
      policyId: "policy_emergency_then_finance",
      description: "Auto-route emergency first and schedule finance follow-up",
      triggered: true,
      executed: false,
      details: { emergencyAction: emergencyTop.title, financeAction: financeAction?.title ?? null }
    };

    if (autoExecute) {
      const job = await enqueueNotification({
        organizationId,
        channel: "push",
        payload: {
          type: "orchestration_policy",
          priority: "p1",
          message: "Critical incident prioritized. Finance follow-up auto-scheduled post-resolution.",
          triggeredBy: policy.policyId,
          userId
        }
      });
      policy.executed = true;
      policy.details.notificationJobId = job.id;
    } else {
      const ai = await AIClientFactory.createClient(organizationId);
      const sim = await ai.explainPolicySimulation({
        policyId: policy.policyId,
        emergencyAction: emergencyTop.title,
        financeAction: financeAction?.title ?? null
      });
      policy.simulation = {
        would_have_executed: true,
        predicted_outcome: sim.predicted_outcome,
        risk_if_not_executed: sim.risk_if_not_executed,
        confidence: sim.confidence
      };
    }
    outcomes.push(policy);
  } else {
    outcomes.push({
      policyId: "policy_emergency_then_finance",
      description: "Auto-route emergency first and schedule finance follow-up",
      triggered: false,
      executed: false,
      details: {}
    });
  }

  if (signals.emergency.criticalIncidents > 0) {
    const policy: PolicyOutcome = {
      policyId: "policy_incident_auto_route",
      description: "Auto-route critical incidents to incident command channel",
      triggered: true,
      executed: false,
      details: { criticalIncidents: signals.emergency.criticalIncidents }
    };
    if (autoExecute) {
      const job = await enqueueNotification({
        organizationId,
        channel: "whatsapp",
        payload: {
          type: "incident_command",
          priority: severityToPriority("critical"),
          incidents: signals.emergency.criticalIncidents,
          directive: "Activate incident command protocol"
        }
      });
      policy.executed = true;
      policy.details.notificationJobId = job.id;
    } else {
      const ai = await AIClientFactory.createClient(organizationId);
      const sim = await ai.explainPolicySimulation({
        policyId: policy.policyId,
        criticalIncidents: signals.emergency.criticalIncidents
      });
      policy.simulation = {
        would_have_executed: true,
        predicted_outcome: sim.predicted_outcome,
        risk_if_not_executed: sim.risk_if_not_executed,
        confidence: sim.confidence
      };
    }
    outcomes.push(policy);
  }

  if (signals.reporting.staleReports24h > 0) {
    const policy: PolicyOutcome = {
      policyId: "policy_reporting_refresh",
      description: "Auto-generate stale reports for executive visibility",
      triggered: true,
      executed: false,
      details: { staleReports24h: signals.reporting.staleReports24h }
    };

    if (autoExecute) {
      const job = await enqueueReportGeneration({
        organizationId,
        reportType: "daily",
        requestedBy: userId
      });
      policy.executed = true;
      policy.details.reportJobId = job.id;
    } else {
      const ai = await AIClientFactory.createClient(organizationId);
      const sim = await ai.explainPolicySimulation({
        policyId: policy.policyId,
        staleReports: signals.reporting.staleReports24h
      });
      policy.simulation = {
        would_have_executed: true,
        predicted_outcome: sim.predicted_outcome,
        risk_if_not_executed: sim.risk_if_not_executed,
        confidence: sim.confidence
      };
    }

    outcomes.push(policy);
  }

  logger.info("Autonomous workflow policies evaluated", {
    organizationId,
    outcomes: outcomes.map((o) => ({ id: o.policyId, triggered: o.triggered, executed: o.executed }))
  });

  return outcomes;
}
