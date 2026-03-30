import axios from "axios";
import type { AxiosRequestConfig } from "axios";
import type { ReportingSummary } from "../types";
import type { 
  LiveOrchestrationResult,
  ScoredAction,
  FeedbackRequest, 
  FeedbackResponse,
  AnomalyEvent,
  NaturalLanguageQuery,
  StreamingToken 
} from "../types/orchestration";
import type {
  AiSpendSummary,
  BusinessSummary,
  ClientBrief,
  ClientProfile,
  LoyaltySummary,
  StaffMember,
  StaffPerformance,
  TenantHealth,
  TodaysSchedule
} from "../types/audience";
import { APIError } from "../types/api";

export type SupportTicket = {
  id: string | null;
  customer_id: string | null;
  channel: string | null;
  event: string | null;
  recipient: string | null;
  status: string | null;
  provider_id: string | null;
  sent_at: string | null;
  error: string | null;
  created_at: string | null;
};

// ─── Inventory / CRM / Delivery types ───────────────────────────────────────
export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  uom: string;
  cost_price_cents?: number | null;
  sell_price_cents?: number | null;
  reorder_threshold?: number;
  available_quantity?: number;
  category_id?: string | null;
  default_warehouse_id?: string | null;
  is_active?: boolean;
}

export interface CrmLead {
  id: string;
  status: string;
  source?: string | null;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  owner_id?: string | null;
  score?: number | null;
  notes?: string | null;
}

export interface CrmDeal {
  id: string;
  title: string;
  stage: string;
  value_cents?: number | null;
  currency?: string;
  probability?: number | null;
  close_date?: string | null;
}

export interface CrmActivity {
  id: string;
  activity_type: string;
  subject: string;
  due_at?: string | null;
  completed_at?: string | null;
}

export interface DeliveryBooking {
  id: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  pickup_address: string;
  dropoff_address: string;
  pickup_at?: string | null;
  dropoff_at?: string | null;
  price_cents?: number | null;
  currency?: string;
  status: string;
  recipient_name?: string | null;
  recipient_phone?: string | null;
  notes?: string | null;
  created_at?: string;
  rider_name?: string | null;
  proof_of_delivery?: string | null;
  estimated_delivery?: string | null;
  rating?: number | null;
}

// ────────────────────────────────────────────────────────────────────────────
// AXIOS INSTANCE – Default export for CRUD hook use
// ────────────────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
const SAFE_HTTP_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const CSRF_SESSION_STORAGE_KEY = "kora_csrf_session_id";
const CSRF_TOKEN_STORAGE_KEY = "kora_csrf_token";

let csrfTokenPromise: Promise<string> | null = null;

const axiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

function createClientSessionId() {
  if (typeof globalThis !== "undefined" && "crypto" in globalThis && typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `csrf-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getCsrfSessionId() {
  const existing = localStorage.getItem(CSRF_SESSION_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const sessionId = createClientSessionId();
  localStorage.setItem(CSRF_SESSION_STORAGE_KEY, sessionId);
  return sessionId;
}

function clearStoredCsrfToken() {
  localStorage.removeItem(CSRF_TOKEN_STORAGE_KEY);
}

function readStoredCsrfToken() {
  return localStorage.getItem(CSRF_TOKEN_STORAGE_KEY) ?? "";
}

function extractErrorMessage(payload: unknown): string | null {
  if (!payload) {
    return null;
  }

  if (typeof payload === "string") {
    return payload;
  }

  if (typeof payload === "object") {
    const candidate = payload as {
      message?: string;
      error?: string | { message?: string };
    };

    if (typeof candidate.message === "string") {
      return candidate.message;
    }

    if (typeof candidate.error === "string") {
      return candidate.error;
    }

    if (candidate.error && typeof candidate.error === "object" && typeof candidate.error.message === "string") {
      return candidate.error.message;
    }
  }

  return null;
}

function isCsrfError(payload: unknown) {
  const message = extractErrorMessage(payload)?.toLowerCase() ?? "";
  return message.includes("csrf");
}

async function fetchCsrfToken() {
  const sessionId = getCsrfSessionId();
  const token = getAuthToken();
  const orgId = getOrgId();
  const response = await fetch(`${API_BASE}/api/csrf-token`, {
    method: "GET",
    headers: {
      "X-Session-Id": sessionId,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(orgId ? { "X-Organization-Id": orgId, "X-Org-Id": orgId } : {}),
    },
  });

  if (!response.ok) {
    throw new Error("Failed to obtain CSRF token");
  }

  const payload = (await response.json()) as {
    csrfToken?: string;
    data?: { csrfToken?: string };
  };
  const csrfToken = payload.data?.csrfToken ?? payload.csrfToken ?? "";
  if (!csrfToken) {
    throw new Error("CSRF token missing from response");
  }

  localStorage.setItem(CSRF_TOKEN_STORAGE_KEY, csrfToken);
  return csrfToken;
}

async function ensureCsrfToken(forceRefresh = false) {
  const sessionId = getCsrfSessionId();
  if (!forceRefresh) {
    const cachedToken = readStoredCsrfToken();
    if (cachedToken) {
      return { sessionId, csrfToken: cachedToken };
    }
  }

  if (!csrfTokenPromise || forceRefresh) {
    csrfTokenPromise = fetchCsrfToken().finally(() => {
      csrfTokenPromise = null;
    });
  }

  const csrfToken = await csrfTokenPromise;
  return { sessionId, csrfToken };
}

function unwrapApiPayload<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in (payload as Record<string, unknown>)) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export function getApiErrorMessage(error: unknown, fallback = "Request failed") {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as
      | { error?: { message?: string } | string; message?: string }
      | undefined;

    if (typeof responseData?.error === "string") return responseData.error;
    if (responseData?.error && typeof responseData.error === "object" && responseData.error.message) {
      return responseData.error.message;
    }
    if (responseData?.message) return responseData.message;
    if (error.message) return error.message;
  }

  if (error instanceof Error) return error.message;
  return fallback;
}

/**
 * Canonical authenticated client for all protected KORA API calls.
 * Do not use raw fetch("/api/...") from routed pages or platform modules.
 */
export const apiClient = {
  get: async <T>(path: string, config?: AxiosRequestConfig) => {
    const response = await axiosInstance.get(path, config);
    return unwrapApiPayload<T>(response.data);
  },
  post: async <T>(path: string, body?: unknown, config?: AxiosRequestConfig) => {
    const response = await axiosInstance.post(path, body, config);
    return unwrapApiPayload<T>(response.data);
  },
  put: async <T>(path: string, body?: unknown, config?: AxiosRequestConfig) => {
    const response = await axiosInstance.put(path, body, config);
    return unwrapApiPayload<T>(response.data);
  },
  patch: async <T>(path: string, body?: unknown, config?: AxiosRequestConfig) => {
    const response = await axiosInstance.patch(path, body, config);
    return unwrapApiPayload<T>(response.data);
  },
  delete: async <T>(path: string, config?: AxiosRequestConfig) => {
    const response = await axiosInstance.delete(path, config);
    return unwrapApiPayload<T>(response.data);
  }
};

// Request interceptor – attach JWT + org ID
axiosInstance.interceptors.request.use(async (config) => {
  const token = localStorage.getItem("kora_token") ||
                import.meta.env.VITE_DEV_BEARER_TOKEN ||
                "";

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const orgId = localStorage.getItem("kora_org_id") ||
                import.meta.env.VITE_ORG_ID ||
                "org_placeholder";

  if (orgId) {
    config.headers["X-Organization-Id"] = orgId;
    config.headers["X-Org-Id"] = orgId;
  }

  const method = (config.method ?? "get").toUpperCase();
  if (!SAFE_HTTP_METHODS.has(method)) {
    const { sessionId, csrfToken } = await ensureCsrfToken();
    config.headers["X-Session-Id"] = sessionId;
    config.headers["X-CSRF-Token"] = csrfToken;
  }

  return config;
});

// Response interceptor – error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("kora_token");
      localStorage.removeItem("kora_org_id");
      clearStoredCsrfToken();
      window.dispatchEvent(new CustomEvent("kora-auth-logout"));
    }

    if (error.response?.status === 403 && isCsrfError(error.response?.data)) {
      clearStoredCsrfToken();
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

const API_BASE_OLD = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH";

// 401 auto-refresh attempts
let authRefreshAttempts = 0;
const MAX_REFRESH_ATTEMPTS = 2;

function getAuthToken(): string {
  return localStorage.getItem("kora_token") ?? import.meta.env.VITE_DEV_BEARER_TOKEN ?? "";
}

function getOrgId(): string {
  return localStorage.getItem("kora_org_id") ?? import.meta.env.VITE_ORG_ID ?? "org_placeholder";
}

async function request<T>(
  path: string,
  method: HttpMethod = "GET",
  body?: unknown,
  organizationId?: string,
  skipAuthRefresh = false
): Promise<T> {
  const token = getAuthToken();
  const orgId = organizationId || getOrgId();
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  if (orgId) {
    headers["X-Organization-Id"] = orgId;
    headers["X-Org-Id"] = orgId;
  }

  if (!SAFE_HTTP_METHODS.has(method)) {
    const { sessionId, csrfToken } = await ensureCsrfToken();
    headers["X-Session-Id"] = sessionId;
    headers["X-CSRF-Token"] = csrfToken;
  }

  try {
    const res = await fetch(`${API_BASE_OLD}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    // Handle 401 - attempt refresh once
    if (res.status === 401 && !skipAuthRefresh && authRefreshAttempts < MAX_REFRESH_ATTEMPTS) {
      authRefreshAttempts++;
      // Clear stored token and retry
      localStorage.removeItem("kora_token");
      return request<T>(path, method, body, organizationId, true);
    }

    if (!res.ok) {
      const text = await res.text();
      let parsedPayload: unknown = text;
      try {
        parsedPayload = JSON.parse(text);
      } catch {
        parsedPayload = text;
      }

      if (res.status === 403 && isCsrfError(parsedPayload)) {
        clearStoredCsrfToken();
      }
      
      // Map status codes to user-friendly messages
      let userMessage: string;
      switch (res.status) {
        case 401:
          userMessage = "Authentication required. Please log in.";
          break;
        case 403:
          userMessage = "You don't have permission to access this resource.";
          break;
        case 429:
          userMessage = "Rate limited. Please wait a moment before trying again.";
          break;
        case 500:
          userMessage = "Server error. Please try again in a moment.";
          break;
        default:
          userMessage = `Request failed: ${text || "Unknown error"}`;
      }
      
      throw new APIError(res.status, path, userMessage, text);
    }

    authRefreshAttempts = 0;  // Reset on success
    return res.json() as Promise<T>;
  } catch (error) {
    if (error instanceof APIError) throw error;
    
    // Network error
    throw new APIError(
      0,
      path,
      "Network error. Please check your connection.",
      error
    );
  }
}

export async function getReportingSummary(): Promise<ReportingSummary> {
  return request<ReportingSummary>("/api/reporting/summary", "GET");
}

export interface AIInsight {
  title: string;
  impact: string;
  action: string;
}

export interface AISuggestion {
  category: string;
  action: string;
  potentialSavings: string;
}

export interface AIRankedCommand {
  rank: number;
  commandId: string;
  reasoning: string;
}

export interface AIPredictions {
  nextWeekRevenue?: number;
  predictedBookings?: number;
  staffNeeded?: number;
}

export async function getAIInsights(organizationId?: string) {
  return request<{ insights: AIInsight[] }>("/api/ai/insights", "GET", undefined, organizationId);
}

export async function getAISuggestions(organizationId?: string) {
  return request<{ suggestions: AISuggestion[] }>("/api/ai/suggestions", "GET", undefined, organizationId);
}

export async function getAIPredictions(organizationId?: string) {
  return request<{ predictions: AIPredictions }>("/api/ai/predictions", "GET", undefined, organizationId);
}

export async function rankAICommands(
  commands: Array<{ id: string; title: string; severity: string; context: string }>,
  organizationId?: string
) {
  return request<{ ranked: AIRankedCommand[] }>("/api/ai/rank-commands", "POST", { commands }, organizationId);
}

// ═══════════════════════════════════════════════════════════════
// ORCHESTRATION API (NEW)
// ═══════════════════════════════════════════════════════════════

/**
 * Get live orchestration results with prioritized commands
 */
export async function orchestrateLive(
  topN: number = 5,
  autoExecute: boolean = false,
  organizationId?: string
): Promise<LiveOrchestrationResult> {
  return request<LiveOrchestrationResult>(
    "/api/ai/orchestrate/live",
    "POST",
    { topN, autoExecute },
    organizationId
  );
}

/**
 * Submit feedback on an orchestration action
 */
export async function submitOrchestrationFeedback(
  feedback: FeedbackRequest,
  organizationId?: string
): Promise<FeedbackResponse> {
  return request<FeedbackResponse>(
    "/api/ai/orchestrate/feedback",
    "POST",
    feedback,
    organizationId
  );
}

/**
 * Get detected anomalies for organization
 */
export async function getAnomalies(organizationId?: string): Promise<{ anomalies: AnomalyEvent[] }> {
  return request<{ anomalies: AnomalyEvent[] }>(
    "/api/ai/anomalies",
    "GET",
    undefined,
    organizationId
  );
}

/**
 * Submit natural language query for analysis
 */
export async function queryAI(
  query: NaturalLanguageQuery,
  organizationId?: string
): Promise<{ response: string; model: string; latency_ms: number }> {
  return request(
    "/api/ai/query",
    "POST",
    query,
    organizationId
  );
}

/**
 * Get current system status and provider health
 */
export async function getAIStatus(organizationId?: string): Promise<{ 
  status: string; 
  providers: Record<string, { available: boolean; latency_ms: number }>;
  models: Record<string, boolean>;
}> {
  return request(
    "/api/ai/status",
    "GET",
    undefined,
    organizationId
  );
}

/**
 * Natural language query alias for frontend component
 */
export async function naturalLanguageQuery(
  input: { question: string; context?: string; topN?: number },
  organizationId?: string
): Promise<{ 
  answer: string;
  modelUsed: string;
  latencyMs: number;
  tokenCount: number;
}> {
  const result = await request<{
    answer?: string;
    response?: string;
    modelUsed?: string;
    model?: string;
    latencyMs?: number;
    latency_ms?: number;
    tokens?: { totalTokens: number };
  }>(
    "/api/ai/query",
    "POST",
    input,
    organizationId
  );

  return {
    answer: result.answer ?? result.response ?? '',
    modelUsed: result.modelUsed ?? result.model ?? 'unknown',
    latencyMs: result.latencyMs ?? result.latency_ms ?? 0,
    tokenCount: result.tokens?.totalTokens ?? 0,
  };
}

export async function getClientProfile(clientId: string, organizationId?: string): Promise<ClientProfile> {
  return request<ClientProfile>(`/api/clients/${clientId}`, "GET", undefined, organizationId);
}

export async function listCustomers(
  params: { search?: string; limit?: number; offset?: number } = {},
  organizationId?: string
): Promise<{ count: number; clients: CustomerListItem[] }> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (typeof params.limit === "number") query.set("limit", String(params.limit));
  if (typeof params.offset === "number") query.set("offset", String(params.offset));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return request(`/api/clients${suffix}`, "GET", undefined, organizationId);
}

export async function getClientLoyalty(clientId: string, organizationId?: string): Promise<LoyaltySummary> {
  return request<LoyaltySummary>(`/api/clients/${clientId}/loyalty`, "GET", undefined, organizationId);
}

export async function getBusinessSummary(organizationId?: string): Promise<BusinessSummary> {
  return request<BusinessSummary>("/api/analytics/business-summary", "GET", undefined, organizationId);
}

export async function getChurnPrediction(lookbackDays: number = 90, organizationId?: string): Promise<{
  at_risk_clients: Array<{ id: string; name: string; days_since_visit: number; predicted_churn_pct: number; recommended_action: string }>;
}> {
  return request("/api/analytics/churn-prediction", "POST", { lookback_days: lookbackDays }, organizationId);
}

export async function getStaffRoster(organizationId?: string): Promise<{ module: string; count: number; staff: StaffMember[] }> {
  return request("/api/staff", "GET", undefined, organizationId);
}

export async function getStaffPerformance(staffId: string, organizationId?: string): Promise<StaffPerformance> {
  return request<StaffPerformance>(`/api/analytics/staff-performance/${staffId}`, "GET", undefined, organizationId);
}

export async function getTodaySchedule(organizationId?: string): Promise<TodaysSchedule[]> {
  return request<TodaysSchedule[]>("/api/staff/today-schedule", "GET", undefined, organizationId);
}

export async function getClientBrief(appointmentId: string, organizationId?: string): Promise<ClientBrief> {
  return request<ClientBrief>(`/api/staff/client-brief/${appointmentId}`, "GET", undefined, organizationId);
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: "checked_in" | "in_progress" | "completed" | "no_show",
  organizationId?: string
): Promise<{ updated: boolean; status: string }> {
  return request(`/api/staff/appointments/${appointmentId}/status`, "POST", { status }, organizationId);
}

export async function getTenantHealth(organizationId?: string): Promise<TenantHealth[]> {
  return apiClient.get<TenantHealth[]>("/api/platform/tenant-health", {
    headers: organizationId ? { "X-Organization-Id": organizationId, "X-Org-Id": organizationId } : undefined
  });
}

export async function getPlatformBusinesses(organizationId?: string): Promise<PlatformBusiness[]> {
  return request("/api/platform/businesses", "GET", undefined, organizationId);
}

export async function getAuditLogs(limit: number = 40, organizationId?: string): Promise<{ count: number; logs: AuditLogRecord[] }> {
  return request(`/api/platform/audit-logs?limit=${encodeURIComponent(String(limit))}`, "GET", undefined, organizationId);
}

export async function getPaymentConfig(organizationId?: string): Promise<{
  module: string;
  organization_id: string;
  tenant_id?: string | null;
  stripe: {
    configured: boolean;
    publishableKeyPresent: boolean;
    webhookConfigured: boolean;
    mode: string;
  };
}> {
  return request("/api/payments/config", "GET", undefined, organizationId);
}

export async function getPlatformUsers(limit: number = 80, organizationId?: string): Promise<{ count: number; users: PlatformUserRecord[] }> {
  return apiClient.get(`/api/platform/users?page=1&pageSize=${encodeURIComponent(String(limit))}`, {
    headers: organizationId ? { "X-Organization-Id": organizationId, "X-Org-Id": organizationId } : undefined
  });
}

export async function getFeatureFlags(organizationId?: string): Promise<{ count: number; flags: FeatureFlagRecord[] }> {
  return apiClient.get("/api/platform/feature-flags", {
    headers: organizationId ? { "X-Organization-Id": organizationId, "X-Org-Id": organizationId } : undefined
  });
}

export async function getRevenueAnalytics(organizationId?: string): Promise<RevenueAnalyticsSummary> {
  return apiClient.get("/api/platform/revenue", {
    headers: organizationId ? { "X-Organization-Id": organizationId, "X-Org-Id": organizationId } : undefined
  });
}

export async function getSubscriptionPlans(organizationId?: string): Promise<{ count: number; plans: SubscriptionPlanRecord[] }> {
  return request("/api/platform/subscription-plans", "GET", undefined, organizationId);
}

export async function getGlobalConfiguration(organizationId?: string): Promise<GlobalConfigurationRecord> {
  return request("/api/platform/global-configuration", "GET", undefined, organizationId);
}

export async function getModuleReadiness(organizationId?: string): Promise<{ modules: ModuleReadinessRecord[] }> {
  return request("/api/platform/module-readiness", "GET", undefined, organizationId);
}

export async function getMarketplaceListings(organizationId?: string): Promise<{ count: number; listings: MarketplaceListingRecord[] }> {
  return request("/api/platform/marketplace-listings", "GET", undefined, organizationId);
}

export async function getAutomationRules(organizationId?: string): Promise<{ count: number; rules: AutomationRuleRecord[] }> {
  return request("/api/platform/automation-rules", "GET", undefined, organizationId);
}

export async function getAISpendSummary(organizationId?: string): Promise<AiSpendSummary> {
  return apiClient.get<AiSpendSummary>("/api/platform/ai-usage", {
    headers: organizationId ? { "X-Organization-Id": organizationId, "X-Org-Id": organizationId } : undefined
  });
}

export interface DiscoveryCategory {
  id: string;
  slug: string;
  label: string;
  icon: string | null;
  venue_count: number;
}

export interface DiscoveryVenue {
  id: string;
  slug: string;
  display_name: string;
  city: string | null;
  rating: number;
  review_count: number;
  cover_image_url: string | null;
  matching_services: Array<{ name: string }>;
}

export interface VenueProfile {
  id: string;
  organization_id: string;
  display_name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  cover_image_url: string | null;
  logo_url: string | null;
  address_line1: string | null;
  city: string | null;
  postcode: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  rating: number;
  review_count: number;
  features: string[] | null;
  opens_at: string | null;
  closes_at: string | null;
}

export interface VenueService {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  category_label: string | null;
  category_slug: string | null;
  image_url: string | null;
  min_price: number | null;
  max_price: number | null;
  price: number;
}

export interface OrganizationService extends VenueService {
  category_id: string | null;
  currency: string | null;
}

export interface AvailabilitySlot {
  start_time: string;
  end_time: string;
  staff_id: string;
  room_id: string | null;
  is_available: boolean;
}

export interface BookingConfirmationPayload {
  booking_id: string;
  reference: string;
  start_time: string;
  end_time: string;
  status: string;
  service_name: string | null;
  staff_name: string | null;
  staff_photo_url: string | null;
  venue_name: string | null;
  amount_paid: number;
  receipt_url: string | null;
}

export interface CalendarAppointment {
  id: string;
  start_time: string;
  end_time: string;
  status: "confirmed" | "checked_in" | "in_progress" | "completed" | "no_show";
  room_id: string | null;
  room: string | null;
  staff_member_id: string;
  staff_name: string;
  client_id: string | null;
  client_name: string | null;
  service_id: string | null;
  service_name: string | null;
  notes: string | null;
}

export interface CustomerListItem {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  loyalty_points: number;
  membership_tier: string;
  risk_score: number | null;
  created_at: string;
}

export interface CRMLead {
  id: string;
  tenant_id?: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  source: string | null;
  status: string | null;
  created_at: string;
}

export interface CRMOpportunity {
  id: string;
  tenant_id?: string | null;
  lead_id: string;
  value: number;
  stage: string;
  expected_close_date: string | null;
  created_at: string;
}

export interface PaymentTransactionRecord {
  id: string;
  tenant_id?: string | null;
  customer_id?: string | null;
  amount_cents?: number;
  amount?: number;
  currency: string;
  status: string;
  provider?: string | null;
  payment_method_type?: string | null;
  created_at: string;
  receipt_url?: string | null;
  failure_code?: string | null;
  failure_message?: string | null;
}

export interface PlatformBusiness {
  org_id: string;
  tenant_id?: string;
  org_name: string;
  industry: string | null;
  status: string;
  created_at: string;
  monthly_active_users: number;
}

export interface AuditLogRecord {
  id: string;
  organization_id: string | null;
  tenant_id?: string | null;
  actor_id: string | null;
  action: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface CustomerRankRecord {
  id: string;
  tenant_id?: string | null;
  name: string;
  points_threshold: number;
  benefits: unknown;
}

export interface LoyaltyAccountRecord {
  customer_id?: string | null;
  tenant_id?: string | null;
  points_balance?: number;
  tier_id?: string | null;
}

export interface TenantBranchRecord {
  id: string;
  organization_id: string;
  tenant_id?: string;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  created_at: string;
}

export interface SupportQueueItem {
  id: string;
  customer_id?: string | null;
  channel: string;
  event: string;
  recipient: string;
  status: string;
  provider_id: string | null;
  sent_at: string | null;
  error: string | null;
  created_at: string;
}

export interface SupportCaseRecord {
  id: string;
  customer_id?: string | null;
  customer_name?: string | null;
  channel: string;
  event: string;
  description: string;
  status: "open" | "assigned" | "in_progress" | "resolved" | "closed" | "escalated";
  priority: "low" | "medium" | "high" | "critical";
  assignee_id?: string | null;
  assignee_name?: string | null;
  resolution_note?: string | null;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  closed_at?: string | null;
}

export interface CampaignRecord {
  id: string;
  name: string;
  channel: string;
  status: string;
  sent_count: number;
  open_count: number;
  created_at: string;
}

export interface PromotionRecord {
  id: string;
  code: string | null;
  type: string;
  value: number;
  min_spend: number;
  max_uses: number | null;
  uses_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
}

export interface CustomerFeedbackRecord {
  id: string;
  client_id: string;
  booking_id: string | null;
  staff_member_id: string | null;
  rating: number;
  body: string | null;
  is_verified: boolean;
  is_published: boolean;
  ai_sentiment: "positive" | "neutral" | "negative" | null;
  created_at: string;
}

export interface PlatformUserRecord {
  id: string;
  organization_id: string | null;
  tenant_id?: string | null;
  branch_id: string | null;
  name: string | null;
  email: string;
  phone: string | null;
  role_id: string | null;
  status: string;
  created_at: string;
}

export interface FeatureFlagRecord {
  key: string;
  enabled: boolean;
  source: string;
  scope: string;
}

export interface RevenueAnalyticsSummary {
  completed_revenue_cents: number;
  transaction_count: number;
  average_transaction_value_cents: number;
  by_org: Array<{
    org_id: string;
    tenant_id?: string;
    org_name: string;
    completed_revenue_cents: number;
    transaction_count: number;
  }>;
}

export interface SubscriptionPlanRecord {
  id: string;
  name: string;
  billing_cycle: string;
  price_usd: number;
  active: boolean;
  tenants_on_plan: number;
}

export interface GlobalConfigurationRecord {
  environment: string;
  auth_provider: string;
  payments: {
    stripe_configured: boolean;
    webhook_configured: boolean;
  };
  ai: Record<string, boolean>;
  modules: Record<string, boolean>;
}

export interface ModuleReadinessRecord {
  key: string;
  status: string;
  source: string;
}

export interface WaitlistRecord {
  id: string;
  customer_id?: string | null;
  client_id?: string | null;
  service_id: string;
  service_name?: string | null;
  preferred_staff_member_id?: string | null;
  preferred_date?: string | null;
  preferred_time_from?: string | null;
  preferred_time_to?: string | null;
  status: string;
  notified_at: string | null;
  created_at: string;
}

export interface MarketplaceListingRecord {
  id: string;
  tenant_id?: string | null;
  organization_id: string;
  slug: string;
  display_name: string;
  city: string | null;
  rating: number;
  review_count: number;
  cover_image_url: string | null;
  opens_at: string | null;
  closes_at: string | null;
  top_service_name: string | null;
  top_service_price: number | null;
  visibility: string;
}

export interface AutomationRuleRecord {
  key: string;
  module: string;
  status: string;
  trigger: string;
  action: string;
}

export async function getDiscoveryCategories(organizationId?: string): Promise<{ count: number; categories: DiscoveryCategory[] }> {
  return request("/api/discovery/categories", "GET", undefined, organizationId);
}

export async function searchVenues(
  params: { q?: string; city?: string; category?: string; rating?: number },
  organizationId?: string
): Promise<{ count: number; venues: DiscoveryVenue[] }> {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.city) query.set("city", params.city);
  if (params.category) query.set("category", params.category);
  if (typeof params.rating === "number") query.set("rating", String(params.rating));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return request(`/api/discovery/search${suffix}`, "GET", undefined, organizationId);
}

export async function getFeaturedVenues(city?: string, organizationId?: string): Promise<{ count: number; venues: DiscoveryVenue[] }> {
  const suffix = city ? `?city=${encodeURIComponent(city)}` : "";
  return request(`/api/discovery/featured${suffix}`, "GET", undefined, organizationId);
}

export async function getVenueProfile(slug: string, organizationId?: string): Promise<VenueProfile> {
  return request(`/api/discovery/venues/${slug}`, "GET", undefined, organizationId);
}

export async function getVenueServices(slug: string, organizationId?: string): Promise<{ count: number; services: VenueService[] }> {
  return request(`/api/discovery/venues/${slug}/services`, "GET", undefined, organizationId);
}

export async function getAvailability(
  staffMemberId: string,
  params: { date: string; serviceId?: string },
  organizationId?: string
): Promise<{ date: string; slots: AvailabilitySlot[] }> {
  const query = new URLSearchParams({ date: params.date });
  if (params.serviceId) query.set("serviceId", params.serviceId);
  return request(`/api/availability/${staffMemberId}?${query.toString()}`, "GET", undefined, organizationId);
}

export async function getOrganizationServices(organizationId?: string): Promise<{ count: number; services: OrganizationService[] }> {
  return request("/api/services", "GET", undefined, organizationId);
}

export async function getLeads(organizationId?: string): Promise<{ count: number; leads: CRMLead[] }> {
  return request("/api/crm/leads", "GET", undefined, organizationId);
}

export async function getOpportunities(organizationId?: string): Promise<{ count: number; opportunities: CRMOpportunity[] }> {
  return request("/api/crm/opportunities", "GET", undefined, organizationId);
}

export async function getCustomerRanks(organizationId?: string): Promise<{ count: number; ranks: CustomerRankRecord[] }> {
  return request("/api/crm/ranks", "GET", undefined, organizationId);
}

export async function getLoyaltyAccounts(organizationId?: string): Promise<{ count: number; accounts: LoyaltyAccountRecord[] }> {
  return request("/api/crm/loyalty-accounts", "GET", undefined, organizationId);
}

export async function getTenantBranches(organizationId?: string): Promise<{ count: number; branches: TenantBranchRecord[] }> {
  return request("/api/tenant/branches", "GET", undefined, organizationId);
}

export async function listSupportCases(
  params: {
    limit?: number;
    page?: number;
    sort?: string;
    status?: string;
    search?: string;
  } = {},
  organizationId?: string
): Promise<SupportCaseRecord[]> {
  const headers = organizationId
    ? {
        "X-Organization-Id": organizationId,
        "X-Org-Id": organizationId,
      }
    : undefined;

  return apiClient.get<SupportCaseRecord[]>("/api/support/cases", {
    params,
    headers,
  });
}

export async function getSupportDashboardSummary(organizationId?: string): Promise<Array<{ status: string; count: number }>> {
  const headers = organizationId
    ? {
        "X-Organization-Id": organizationId,
        "X-Org-Id": organizationId,
      }
    : undefined;

  return apiClient.get<Array<{ status: string; count: number }>>("/api/support/dashboard/summary", {
    headers,
  });
}

export async function getSupportQueue(limit: number = 40, organizationId?: string): Promise<{ count: number; tickets: SupportQueueItem[] }> {
  const cases = await listSupportCases({ limit, sort: "created_at:desc" }, organizationId);

  return {
    count: cases.length,
    tickets: cases.map((supportCase) => ({
      id: supportCase.id,
      customer_id: supportCase.customer_id ?? null,
      channel: supportCase.channel,
      event: supportCase.event,
      recipient: supportCase.customer_name ?? "Support case",
      status: supportCase.status,
      provider_id: supportCase.assignee_id ?? null,
      sent_at: supportCase.status === "resolved" || supportCase.status === "closed" ? supportCase.updated_at ?? null : null,
      error: supportCase.status === "escalated" ? "Escalated support case" : null,
      created_at: supportCase.created_at ?? supportCase.updated_at ?? new Date().toISOString(),
    })),
  };
}

export async function getCampaigns(organizationId?: string): Promise<{ count: number; campaigns: CampaignRecord[] }> {
  return request("/api/campaigns", "GET", undefined, organizationId);
}

export async function getOrganizationReviews(organizationId?: string): Promise<{ count: number; reviews: CustomerFeedbackRecord[] }> {
  const resolvedOrganizationId = organizationId ?? getOrgId();
  return request(`/api/discovery/reviews/${encodeURIComponent(resolvedOrganizationId)}`, "GET", undefined, organizationId);
}

export async function getPromotions(organizationId?: string): Promise<{ count: number; promotions: PromotionRecord[] }> {
  return request("/api/discovery/promotions", "GET", undefined, organizationId);
}

export async function getWaitlistEntries(organizationId?: string): Promise<{ count: number; entries: WaitlistRecord[] }> {
  return request("/api/availability/waitlist/all", "GET", undefined, organizationId);
}

export async function getTeamAvailability(
  params: { date: string; serviceId: string },
  organizationId?: string
): Promise<{
  date: string;
  availability: Array<{
    staff: { id: string; full_name: string; photo_url: string | null };
    slots: AvailabilitySlot[];
  }>;
}> {
  const query = new URLSearchParams({ date: params.date, serviceId: params.serviceId });
  return request(`/api/availability/team/list?${query.toString()}`, "GET", undefined, organizationId);
}

export async function joinWaitlist(
  payload: {
    client_id: string;
    service_id: string;
    preferred_staff_member_id?: string | null;
    preferred_date?: string | null;
    preferred_time_from?: string | null;
    preferred_time_to?: string | null;
  },
  organizationId?: string
) {
  return request("/api/availability/waitlist", "POST", payload, organizationId);
}

export async function createBooking(
  payload: {
    client_id?: string | null;
    service_id: string;
    staff_member_id: string;
    room_id?: string | null;
    start_time: string;
    source?: string;
    notes?: string | null;
  },
  organizationId?: string
) {
  return request("/api/bookings", "POST", payload, organizationId);
}

export async function getBookingConfirmation(bookingId: string, organizationId?: string): Promise<BookingConfirmationPayload> {
  return request(`/api/bookings/${bookingId}`, "GET", undefined, organizationId);
}

export async function cancelBooking(bookingId: string, reason?: string, organizationId?: string) {
  return request(`/api/bookings/${bookingId}/cancel`, "POST", { reason }, organizationId);
}

export async function addBookingNote(bookingId: string, note: string, organizationId?: string) {
  return request(`/api/bookings/${bookingId}/notes`, "POST", { note }, organizationId);
}

export async function validatePromotionCode(
  payload: { code: string; service_id?: string; subtotal?: number },
  organizationId?: string
): Promise<{ valid: boolean; error?: string; promotion?: { id: string; type: string; value: number } }> {
  return request("/api/discovery/promotions/validate", "POST", payload, organizationId);
}

export async function getAppointments(date: string, organizationId?: string): Promise<{ date: string; appointments: CalendarAppointment[] }> {
  return request(`/api/appointments?date=${encodeURIComponent(date)}`, "GET", undefined, organizationId);
}

export async function getPaymentTransactions(
  params: { start_date?: string; end_date?: string; status?: string; method?: string } = {},
  organizationId?: string
): Promise<{ count: number; transactions: PaymentTransactionRecord[] }> {
  const query = new URLSearchParams();
  if (params.start_date) query.set("start_date", params.start_date);
  if (params.end_date) query.set("end_date", params.end_date);
  if (params.status) query.set("status", params.status);
  if (params.method) query.set("method", params.method);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return request(`/api/payments/transactions${suffix}`, "GET", undefined, organizationId);
}

export async function getRefundQueue(
  params: { start_date?: string; end_date?: string; method?: string } = {},
  organizationId?: string
): Promise<{ count: number; refunds: PaymentTransactionRecord[] }> {
  const query = new URLSearchParams();
  if (params.start_date) query.set("start_date", params.start_date);
  if (params.end_date) query.set("end_date", params.end_date);
  if (params.method) query.set("method", params.method);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return request(`/api/payments/refunds${suffix}`, "GET", undefined, organizationId);
}

export async function createAppointment(
  payload: {
    client_id?: string | null;
    service_id: string;
    staff_member_id: string;
    room_id?: string | null;
    start_time: string;
    source?: string;
    notes?: string | null;
  },
  organizationId?: string
) {
  return request("/api/appointments", "POST", payload, organizationId);
}

export async function updateAppointment(
  appointmentId: string,
  payload: {
    start_time?: string;
    end_time?: string;
    staff_member_id?: string;
    room_id?: string | null;
    status?: string;
  },
  organizationId?: string
) {
  return request(`/api/appointments/${appointmentId}`, "PATCH", payload, organizationId);
}

export interface AutomationTemplateRecord {
  key: string;
  name: string;
  trigger_key: string;
  description: string;
  actions: Array<{ type: string; label: string }>;
}

export interface AutomationWorkflowRecord {
  id: string;
  name: string;
  trigger_key: string;
  condition_json: Record<string, unknown>;
  action_json: Array<Record<string, unknown>>;
  schedule_json: Record<string, unknown> | null;
  test_mode: boolean;
  active: boolean;
  next_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProviderLocationRecord {
  provider_id?: string;
  staff_member_id?: string;
  location?: { lat: number | null; lng: number | null; last_seen_at?: string | null } | null;
  eta_minutes?: number | null;
  destination?: { label: string };
  route_points?: Array<{ lat: number; lng: number; recorded_at: string }>;
  optimized?: boolean;
}

export interface VideoSessionRecord {
  id: string;
  booking_id?: string | null;
  provider: string;
  room_name: string;
  status: string;
  starts_at?: string | null;
  ends_at?: string | null;
  join_url?: string;
  host_token?: string;
  participant_token?: string;
}

export interface VideoRecordingRecord {
  id: string;
  session_id: string;
  storage_key: string;
  playback_url: string | null;
  transcript_text: string | null;
  quality_score?: string | null;
  duration_seconds?: number | null;
  created_at: string;
}

export interface CanvaTemplateRecord {
  id: string;
  external_template_id: string;
  name: string;
  category: string | null;
  preview_url: string | null;
  brand_kit_json: Record<string, unknown>;
  created_at: string;
}

export async function getAutomationTemplates(organizationId?: string): Promise<{ count: number; templates: AutomationTemplateRecord[] }> {
  return request("/api/automation/templates", "GET", undefined, organizationId);
}

export async function getAutomationWorkflows(organizationId?: string): Promise<{ count: number; workflows: AutomationWorkflowRecord[] }> {
  return request("/api/automation/workflows", "GET", undefined, organizationId);
}

export async function createAutomationWorkflow(
  payload: {
    name: string;
    trigger_key: string;
    condition_json?: Record<string, unknown>;
    action_json?: Array<Record<string, unknown>>;
    schedule_json?: Record<string, unknown> | null;
    test_mode?: boolean;
    active?: boolean;
  },
  organizationId?: string
): Promise<AutomationWorkflowRecord> {
  return request("/api/automation/workflows", "POST", payload, organizationId);
}

export async function testAutomationWorkflow(
  workflowId: string,
  context: Record<string, unknown>,
  organizationId?: string
): Promise<{ condition_passed: boolean; actions_executed: Array<Record<string, unknown>>; mode: string }> {
  return request(`/api/automation/workflows/${workflowId}/test`, "POST", { context }, organizationId);
}

export async function getAutomationAnalyticsSummary(organizationId?: string): Promise<{
  total_workflows: number;
  active_workflows: number;
  total_runs: number;
  average_latency_ms: number;
  templates_available: number;
}> {
  return request("/api/automation/analytics", "GET", undefined, organizationId);
}

export async function getAutomationSuggestions(
  prompt: string,
  organizationId?: string
): Promise<{
  suggestions: Array<{
    title: string;
    trigger_key: string;
    rationale: string;
    recommended_actions: string[];
  }>;
  source: string;
}> {
  return request("/api/automation/suggest", "POST", { prompt }, organizationId);
}

export async function updateProviderLocation(
  providerId: string,
  payload: {
    latitude: number;
    longitude: number;
    accuracy_meters?: number | null;
    speed_kph?: number | null;
    heading_degrees?: number | null;
    source?: string | null;
  },
  organizationId?: string
) {
  return request(`/api/providers/${providerId}/location`, "POST", payload, organizationId);
}

export async function getBookingTracking(bookingId: string, organizationId?: string): Promise<ProviderLocationRecord> {
  return request(`/api/bookings/${bookingId}/tracking`, "GET", undefined, organizationId);
}

export async function createGeofence(
  payload: {
    name: string;
    center_latitude: number;
    center_longitude: number;
    radius_meters: number;
    target_type?: string | null;
    target_id?: string | null;
  },
  organizationId?: string
) {
  return request("/api/geofence/create", "POST", payload, organizationId);
}

export async function getProviderRoute(providerId: string, organizationId?: string): Promise<ProviderLocationRecord> {
  return request(`/api/providers/${providerId}/route`, "GET", undefined, organizationId);
}

export async function createVideoSession(
  payload: { booking_id?: string | null; provider?: string | null; starts_at?: string | null },
  organizationId?: string
): Promise<VideoSessionRecord> {
  return request("/api/video/sessions", "POST", payload, organizationId);
}

export async function getVideoSession(sessionId: string, organizationId?: string): Promise<VideoSessionRecord> {
  return request(`/api/video/sessions/${sessionId}`, "GET", undefined, organizationId);
}

export async function createVideoRecording(
  payload: { session_id: string; storage_key: string; playback_url?: string | null; transcript_text?: string | null; duration_seconds?: number | null },
  organizationId?: string
): Promise<VideoRecordingRecord> {
  return request("/api/video/recordings", "POST", payload, organizationId);
}

export async function getVideoRecording(recordingId: string, organizationId?: string): Promise<VideoRecordingRecord> {
  return request(`/api/video/recordings/${recordingId}`, "GET", undefined, organizationId);
}

export async function getVideoAnalytics(
  sessionId: string,
  organizationId?: string
): Promise<{ session_id: string; recordings: number; avg_quality_score: number; total_duration_seconds: number }> {
  return request(`/api/video/analytics/${sessionId}`, "GET", undefined, organizationId);
}

export async function getCanvaAuthorization(organizationId?: string): Promise<{ state: string; authorization_url: string }> {
  return request("/api/canva/authorize", "GET", undefined, organizationId);
}

export async function getCanvaTemplates(organizationId?: string): Promise<{ count: number; templates: CanvaTemplateRecord[] }> {
  return request("/api/canva/templates", "GET", undefined, organizationId);
}

export async function saveCanvaTemplate(
  payload: {
    external_template_id: string;
    name: string;
    category?: string | null;
    preview_url?: string | null;
    brand_kit_json?: Record<string, unknown>;
  },
  organizationId?: string
): Promise<CanvaTemplateRecord> {
  return request("/api/canva/templates", "POST", payload, organizationId);
}

export async function exportCanvaDesign(
  payload: { template_id: string; format?: "png" | "jpg" | "pdf"; title?: string | null },
  organizationId?: string
): Promise<{ template_id: string; format: string; export_url: string; title: string }> {
  return request("/api/canva/export", "POST", payload, organizationId);
}

// Re-export error and types for consumers
export { APIError };
export type { LiveOrchestrationResult, ScoredAction, FeedbackRequest, FeedbackResponse, AnomalyEvent };

// ─── Clinical API ─────────────────────────────────────────────────────────────

export interface ClinicalPatient {
  id: string;
  organization_id: string;
  customer_id: string | null;
  patient_number: string | null;
  blood_type: string | null;
  allergies: string[];
  current_medications: string[];
  conditions: string[];
  insurance_provider: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  created_at: string;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
}

export interface ClinicalAppointment {
  id: string;
  organization_id: string;
  patient_id: string;
  booking_id: string | null;
  appointment_type: string | null;
  chief_complaint: string | null;
  diagnosis_codes: string[];
  status: string;
  created_at: string;
  patient_name: string | null;
  patient_number: string | null;
}

export interface ClinicalNote {
  id: string;
  appointment_id: string;
  author_id: string | null;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  ai_draft: string | null;
  ai_draft_accepted: boolean;
  created_at: string;
  author_name: string | null;
}

export async function getClinicalPatients(params: { search?: string } = {}, organizationId?: string) {
  const q = params.search ? `?search=${encodeURIComponent(params.search)}` : "";
  return request<{ count: number; patients: ClinicalPatient[] }>(`/api/clinical/patients${q}`, "GET", undefined, organizationId);
}

export async function createClinicalPatient(payload: Partial<ClinicalPatient>, organizationId?: string) {
  return request<ClinicalPatient>("/api/clinical/patients", "POST", payload, organizationId);
}

export async function getClinicalAppointments(organizationId?: string) {
  return request<{ count: number; appointments: ClinicalAppointment[] }>("/api/clinical/appointments", "GET", undefined, organizationId);
}

export async function createClinicalAppointment(payload: Partial<ClinicalAppointment>, organizationId?: string) {
  return request<ClinicalAppointment>("/api/clinical/appointments", "POST", payload, organizationId);
}

export async function updateClinicalAppointmentStatus(id: string, status: string, organizationId?: string) {
  return request<{ id: string; status: string }>(`/api/clinical/appointments/${id}/status`, "PATCH", { status }, organizationId);
}

export async function getClinicalNotes(appointmentId: string, organizationId?: string) {
  return request<{ count: number; notes: ClinicalNote[] }>(`/api/clinical/appointments/${appointmentId}/notes`, "GET", undefined, organizationId);
}

export async function createClinicalNote(appointmentId: string, payload: Partial<ClinicalNote>, organizationId?: string) {
  return request<ClinicalNote>(`/api/clinical/appointments/${appointmentId}/notes`, "POST", payload, organizationId);
}

export async function getClinicalCompliance(organizationId?: string) {
  return request<{ patient_count: number; appointment_count: number; note_count: number }>("/api/clinical/compliance", "GET", undefined, organizationId);
}

// ─── Emergency API ────────────────────────────────────────────────────────────

export interface EmergencyRequest {
  id: string;
  organization_id: string;
  customer_id: string | null;
  request_type: string;
  location_lat: number | null;
  location_lng: number | null;
  address: string | null;
  severity: "critical" | "high" | "medium" | "low";
  caller_name: string | null;
  caller_phone: string | null;
  status: string;
  assigned_unit_id: string | null;
  assigned_unit_name: string | null;
  response_time_seconds: number | null;
  notes: string | null;
  created_at: string;
  resolved_at: string | null;
  caller_client_name: string | null;
}

export interface DispatchUnit {
  id: string;
  organization_id: string;
  unit_name: string;
  unit_type: string | null;
  staff_id: string | null;
  staff_name: string | null;
  current_lat: number | null;
  current_lng: number | null;
  status: string;
  last_updated: string;
}

export interface IncidentReport {
  id: string;
  organization_id: string;
  emergency_request_id: string | null;
  report_type: string | null;
  description: string | null;
  actions_taken: string | null;
  outcome: string | null;
  reported_by: string | null;
  reporter_name: string | null;
  incident_type: string | null;
  severity: string | null;
  created_at: string;
}

export async function getEmergencyRequests(status?: string, organizationId?: string) {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  return request<{ count: number; requests: EmergencyRequest[] }>(`/api/emergency/requests${q}`, "GET", undefined, organizationId);
}

export async function createEmergencyRequest(payload: Partial<EmergencyRequest>, organizationId?: string) {
  return request<EmergencyRequest>("/api/emergency/requests", "POST", payload, organizationId);
}

export async function updateEmergencyStatus(id: string, status: string, organizationId?: string) {
  return request<{ id: string; status: string }>(`/api/emergency/requests/${id}/status`, "PATCH", { status }, organizationId);
}

export async function assignDispatchUnit(requestId: string, unit_id: string, organizationId?: string) {
  return request<{ id: string; status: string; assigned_unit_id: string }>(`/api/emergency/requests/${requestId}/assign`, "POST", { unit_id }, organizationId);
}

export async function getDispatchUnits(organizationId?: string) {
  return request<{ count: number; units: DispatchUnit[] }>("/api/emergency/units", "GET", undefined, organizationId);
}

export async function getActiveIncidentsSummary(organizationId?: string) {
  return request<{ active_count: number; critical_count: number; high_count: number; unassigned_count: number }>("/api/emergency/incidents/active", "GET", undefined, organizationId);
}

export async function getIncidentReports(organizationId?: string) {
  return request<{ count: number; incidents: IncidentReport[] }>("/api/emergency/incidents", "GET", undefined, organizationId);
}

export async function createIncidentReport(payload: Partial<IncidentReport>, organizationId?: string) {
  return request<IncidentReport>("/api/emergency/incidents", "POST", payload, organizationId);
}

// ─── Finance API ──────────────────────────────────────────────────────────────

export interface FinanceKpis {
  revenue_cents: number;
  pending_cents: number;
  overdue_cents: number;
  paid_count: number;
  pending_count: number;
  overdue_count: number;
  total_invoices: number;
  collection_rate_pct: number;
}

export interface Invoice {
  id: string;
  organization_id: string;
  amount_cents: number;
  tax_amount_cents: number;
  discount_amount_cents: number;
  status: "pending" | "paid" | "overdue" | "cancelled";
  due_date: string;
  created_at: string;
  client_name: string | null;
  client_email: string | null;
}

export interface Payout {
  id: string;
  staff_id: string;
  staff_name: string | null;
  period_start: string;
  period_end: string;
  gross_amount_cents: number;
  commission_rate: number;
  net_amount_cents: number;
  status: string;
  paid_at: string | null;
}

export async function getFinanceKpis(organizationId?: string) {
  return request<FinanceKpis>("/api/finance/kpis", "GET", undefined, organizationId);
}

export async function getInvoices(params: { status?: string; limit?: number; offset?: number } = {}, organizationId?: string) {
  const q = new URLSearchParams();
  if (params.status) q.set("status", params.status);
  if (params.limit) q.set("limit", String(params.limit));
  if (params.offset) q.set("offset", String(params.offset));
  const suffix = q.toString() ? `?${q.toString()}` : "";
  return request<{ count: number; invoices: Invoice[] }>(`/api/finance/invoices${suffix}`, "GET", undefined, organizationId);
}

export async function createInvoice(payload: { client_id?: string; amount_cents: number; due_date: string; tax_amount_cents?: number }, organizationId?: string) {
  return request<Invoice>("/api/finance/invoices", "POST", payload, organizationId);
}

export async function updateInvoiceStatus(id: string, status: string, organizationId?: string) {
  return request<{ id: string; status: string }>(`/api/finance/invoices/${id}/status`, "PATCH", { status }, organizationId);
}

export async function getPayouts(organizationId?: string) {
  return request<{ count: number; payouts: Payout[] }>("/api/finance/payouts", "GET", undefined, organizationId);
}

// ─── Inventory API ───────────────────────────────────────────────────────────
export async function listInventoryItems() {
  const res = await axiosInstance.get("/api/inventory/items");
  return res.data.data ?? res.data;
}

export async function createInventoryItem(payload: Partial<InventoryItem>) {
  const res = await axiosInstance.post("/api/inventory/items", payload);
  return res.data;
}

export async function updateInventoryItem(id: string, payload: Partial<InventoryItem>) {
  const res = await axiosInstance.patch(`/api/inventory/items/${id}`, payload);
  return res.data;
}

export async function deleteInventoryItem(id: string) {
  await axiosInstance.delete(`/api/inventory/items/${id}`);
}

export async function listStockMovements(itemId?: string) {
  const res = await axiosInstance.get("/api/inventory/movements", { params: { item_id: itemId } });
  return res.data.data ?? res.data;
}

export async function createStockMovement(payload: {
  item_id: string;
  movement_type: "in" | "out" | "adjust";
  quantity: number;
  warehouse_id?: string | null;
  batch_id?: string | null;
  reference_type?: string;
  reference_id?: string;
  reason?: string;
}) {
  const res = await axiosInstance.post("/api/inventory/movements", payload);
  return res.data;
}

export async function listLowStockAlerts() {
  const res = await axiosInstance.get("/api/inventory/alerts/low-stock");
  return res.data.data ?? res.data;
}

// ─── CRM API ────────────────────────────────────────────────────────────────
export async function listLeads() {
  const res = await axiosInstance.get("/api/crm/leads");
  return res.data.data ?? res.data;
}

export async function createLead(payload: Partial<CrmLead>) {
  const res = await axiosInstance.post("/api/crm/leads", payload);
  return res.data;
}

export async function updateLead(id: string, payload: Partial<CrmLead>) {
  const res = await axiosInstance.patch(`/api/crm/leads/${id}`, payload);
  return res.data;
}

export async function convertLead(id: string) {
  const res = await axiosInstance.post(`/api/crm/leads/${id}/convert`);
  return res.data;
}

export async function listDeals() {
  const res = await axiosInstance.get("/api/crm/deals");
  return res.data.data ?? res.data;
}

export async function createDeal(payload: Partial<CrmDeal>) {
  const res = await axiosInstance.post("/api/crm/deals", payload);
  return res.data;
}

export async function updateDeal(id: string, payload: Partial<CrmDeal>) {
  const res = await axiosInstance.patch(`/api/crm/deals/${id}`, payload);
  return res.data;
}

export async function listActivities() {
  const res = await axiosInstance.get("/api/crm/activities");
  return res.data.data ?? res.data;
}

export async function createActivity(payload: Partial<CrmActivity>) {
  const res = await axiosInstance.post("/api/crm/activities", payload);
  return res.data;
}

export async function completeActivity(id: string) {
  const res = await axiosInstance.patch(`/api/crm/activities/${id}/complete`, {});
  return res.data;
}

// ─── Delivery API ───────────────────────────────────────────────────────────
export async function listDeliveryBookings() {
  const res = await axiosInstance.get("/api/delivery/bookings");
  return res.data.data ?? res.data;
}

export async function createDeliveryBooking(payload: Partial<DeliveryBooking>) {
  const res = await axiosInstance.post("/api/delivery/bookings", payload);
  return res.data;
}

export async function updateDeliveryBooking(id: string, payload: Partial<DeliveryBooking>) {
  const res = await axiosInstance.patch(`/api/delivery/bookings/${id}`, payload);
  return res.data;
}

export async function listDeliveryAgents() {
  const res = await axiosInstance.get("/api/delivery/agents");
  return res.data.data ?? res.data;
}

export async function createDeliveryAgent(payload: { full_name: string; phone?: string; status?: string }) {
  const res = await axiosInstance.post("/api/delivery/agents", payload);
  return res.data;
}

export async function listDeliveryAssignments(bookingId: string) {
  const res = await axiosInstance.get(`/api/delivery/bookings/${bookingId}/assignments`);
  return res.data.data ?? res.data;
}

export async function assignDelivery(bookingId: string, payload: { agent_id?: string; vehicle_id?: string; status?: string }) {
  const res = await axiosInstance.post(`/api/delivery/bookings/${bookingId}/assignments`, payload);
  return res.data;
}

export async function updateDeliveryStatus(bookingId: string, payload: { status: string; notes?: string }) {
  const res = await axiosInstance.post(`/api/delivery/bookings/${bookingId}/status`, payload);
  return res.data;
}

export async function recordProofOfDelivery(bookingId: string, payload: { collected_by?: string; signature_url?: string; photo_url?: string; notes?: string }) {
  const res = await axiosInstance.post(`/api/delivery/bookings/${bookingId}/pod`, payload);
  return res.data;
}

// ─── Content / Blog API ───────────────────────────────────────────────────────

export interface ContentArticle {
  id: string;
  organization_id: string;
  author_id: string | null;
  author_name: string | null;
  title: string;
  slug: string;
  category: string | null;
  excerpt: string | null;
  body: string | null;
  status: "draft" | "pending_review" | "approved" | "published" | "retracted";
  tags: string[];
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function listContentArticles(status?: string, organizationId?: string) {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  return request<{ data: ContentArticle[]; meta: { total: number; page: number; limit: number; total_pages: number } }>(
    `/api/content/articles${q}`, "GET", undefined, organizationId
  );
}

export async function getContentArticle(id: string, organizationId?: string) {
  return request<ContentArticle>(`/api/content/articles/${id}`, "GET", undefined, organizationId);
}

export async function createContentArticle(payload: { title: string; category?: string; excerpt?: string; body?: string; tags?: string[] }, organizationId?: string) {
  return request<ContentArticle>("/api/content/articles", "POST", payload, organizationId);
}

export async function updateContentArticle(id: string, payload: Partial<Pick<ContentArticle, "title" | "category" | "excerpt" | "body" | "tags">>, organizationId?: string) {
  return request<ContentArticle>(`/api/content/articles/${id}`, "PATCH", payload, organizationId);
}

export async function updateContentArticleStatus(id: string, status: ContentArticle["status"], organizationId?: string) {
  return request<{ id: string; status: string }>(`/api/content/articles/${id}/status`, "PATCH", { status }, organizationId);
}

export async function deleteContentArticle(id: string) {
  const res = await axiosInstance.delete(`/api/content/articles/${id}`);
  return (res.data?.data ?? res.data) as { deleted: boolean; id: string };
}

export async function getContentArticleAudit(id: string, organizationId?: string) {
  return request<{ data: Array<{ id: string; action: string; from_status: string; to_status: string; actor_name: string | null; created_at: string }> }>(
    `/api/content/articles/${id}/audit`, "GET", undefined, organizationId
  );
}

// Patch: deleteContentArticle using axiosInstance.delete (request() does not support DELETE method)
