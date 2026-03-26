import type { ReportingMetric } from "./index";

// ═══════════════════════════════════════════════════════════════
// AI ORCHESTRATION DATA CONTRACTS
// ═══════════════════════════════════════════════════════════════

export interface NormalizedCommandCandidate {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  sourceModule: "auth" | "bookings" | "clinical" | "emergency" | "finance" | "ai" | "notifications" | "reporting";
  context: string;
  metadata?: Record<string, unknown>;
}

export interface ScoredAction extends NormalizedCommandCandidate {
  rank: number;
  score: number;  // 0-100
  reasoning: string[];  // Pre-formatted strings like "Severity impact 0.98"
  followUpChain: string[];  // Format: "module:action description"
  confidence: number;  // 0-1
}

export interface PolicyOutcome {
  policyId: string;
  description: string;
  triggered: boolean;
  executed: boolean;
  confidence?: number;
}

export interface LiveOrchestrationResult {
  prioritizedActions: ScoredAction[];
  nextActionRecommendation: string;
  policyOutcomes: PolicyOutcome[];
  refreshedAt: string;
  signals: {
    totalMetricsAnalyzed: number;
    modulesQueried: string[];
  };
}

export interface AnomalyEvent {
  id: string;
  metric_name: string;
  current_value: number;
  expected_range: [number, number];
  z_score: number;
  severity: "critical" | "high" | "medium" | "low";
  explanation_text: string;
  detected_at: string;
  organization_id: string;
}

export interface FeedbackRequest {
  actionId: string;
  commandFingerprint: string;
  outcome: "accepted" | "rejected" | "modified";
  userNotes?: string;
  executionTime?: number;  // ms
}

export interface FeedbackResponse {
  accepted: boolean;
  code: number;
}

// ═══════════════════════════════════════════════════════════════
// API REQUEST/RESPONSE SHAPES
// ═══════════════════════════════════════════════════════════════

export interface OrchestrationRequest {
  topN?: number;  // top N candidates (default 5)
  autoExecute?: boolean;  // block autonomous actions if false
  userRole?: string;  // for context-aware ranking
  organizationId?: string;  // explicit org context
}

export interface StreamingToken {
  token: string;
  model: string;
  latency_ms: number;
}

export interface NaturalLanguageQuery {
  question: string;
  context?: string;
  taskType?: "compliance_advisory" | "operational_analysis" | "financial_forecast";
}

// ═══════════════════════════════════════════════════════════════
// UI STATE
// ═══════════════════════════════════════════════════════════════

export interface CommandCenterUIState {
  expandedReasoningId: string | null;
  expandedFollowUpId: string | null;
  selectedActionId: string | null;
  simulationMode: "accept" | "reject" | "simulate" | null;
  lastRefreshed: number;
  autoRefreshEnabled: boolean;
}

export interface StreamPanelState {
  isStreaming: boolean;
  streamedContent: string;
  streamingModel: string;
  error: string | null;
  completedAt: number | null;
}
