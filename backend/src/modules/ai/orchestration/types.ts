export type CommandSeverity = "critical" | "high" | "medium" | "low";

export interface NormalizedCommandCandidate {
  id: string;
  organizationId: string;
  sourceModule:
    | "auth"
    | "bookings"
    | "clinical"
    | "emergency"
    | "finance"
    | "ai"
    | "notifications"
    | "reporting";
  title: string;
  context: string;
  severity: CommandSeverity;
  dependencies: string[];
  slaRisk: number;
  commandFingerprint: string;
  metadata: Record<string, unknown>;
  detectedAt: string;
}

export interface ScoredAction extends NormalizedCommandCandidate {
  score: number;
  reasoning: string[];
  followUpChain: string[];
}

export interface ModuleSignalSnapshot {
  auth: {
    activeUsers24h: number;
    adminUsers: number;
  };
  bookings: {
    pendingToday: number;
    totalToday: number;
  };
  clinical: {
    recordsToday: number;
  };
  emergency: {
    openIncidents: number;
    criticalIncidents: number;
  };
  finance: {
    overdueInvoices: number;
    overdueAmountCents: number;
  };
  ai: {
    avgLatencyMs1h: number;
    totalRequests1h: number;
  };
  notifications: {
    pendingNotifications: number;
  };
  reporting: {
    staleReports24h: number;
  };
}

export interface CausalityInsight {
  pattern: string;
  affected_modules: string[];
  estimated_revenue_impact_usd: number | null;
  urgency: "immediate" | "24h" | "72h";
  recommended_action: string;
}

export interface OrchestrationContext {
  userRole: string;
  organizationId: string;
  userId: string;
}
