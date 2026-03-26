import { apiClient } from "./api";

export interface PlatformOverviewTenant {
  org_id: string;
  tenant_id: string;
  org_name: string;
  status: "healthy" | "degraded" | "critical";
  monthly_active_users: number;
  ai_spend_this_month_usd: number;
  ai_budget_utilisation_pct: number;
  queue_failures_last_24h: number;
  last_login: string | null;
}

export interface PlatformAiUsageSummary {
  total_spend_usd: number;
  by_provider: Record<string, number>;
  by_org: Array<{
    org_id: string;
    tenant_id: string;
    org_name: string;
    spend_usd: number;
    pct_of_total: number;
  }>;
  top_task_types: Array<{
    task: string;
    token_count: number;
    cost_usd: number;
  }>;
  budget_alerts: Array<{
    org_id: string;
    tenant_id: string;
    org_name: string;
    pct_of_total?: number;
    utilisation_pct?: number;
  }>;
}

export interface PlatformRevenueSummary {
  completed_revenue_cents: number;
  transaction_count: number;
  average_transaction_value_cents: number;
  by_org: Array<{
    org_id: string;
    tenant_id: string;
    org_name: string;
    completed_revenue_cents: number;
    transaction_count: number;
  }>;
}

export interface PlatformOverviewResponse {
  tenant_health: PlatformOverviewTenant[];
  ai_usage: PlatformAiUsageSummary;
  revenue: PlatformRevenueSummary;
  users: {
    count: number;
  };
  feature_flags: {
    count: number;
    enabled_count: number;
  };
  alerts: {
    critical_tenants: number;
    degraded_tenants: number;
    budget_alerts: number;
  };
}

export interface PlatformFeatureFlag {
  key: string;
  enabled: boolean;
  source: string;
  scope: string;
}

export interface PlatformRole {
  id: string;
  name: string;
  description?: string | null;
  user_count?: number;
}

export interface PlatformUser {
  id: string;
  organization_id: string | null;
  tenant_id?: string | null;
  branch_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  name: string | null;
  email: string;
  phone?: string | null;
  role_id: string | null;
  role_name?: string | null;
  status: string;
  email_verified?: boolean;
  phone_verified?: boolean;
  created_at: string;
  updated_at?: string | null;
}

export interface TenantRecord {
  id: string;
  name: string;
  industry: string | null;
  status: string;
  created_at: string;
}

export interface SubscriptionRecord {
  id: string;
  organization_id: string;
  plan: string;
  status: string;
  current_period_start: string;
  current_period_end: string | null;
  provider_subscription_id?: string | null;
  created_at: string;
}

export interface BillingSubscriptionDashboard {
  current_subscription: SubscriptionRecord | null;
  billing_history: Array<Record<string, unknown>>;
  plan_limits: Record<string, unknown> | null;
}

export async function getPlatformOverview() {
  return apiClient.get<PlatformOverviewResponse>("/api/platform/overview");
}

export async function getPlatformRevenue() {
  return apiClient.get<PlatformRevenueSummary>("/api/platform/revenue");
}

export async function getPlatformAiUsage() {
  return apiClient.get<PlatformAiUsageSummary>("/api/platform/ai-usage");
}

export async function getPlatformFeatureFlags() {
  const response = await apiClient.get<{ count: number; flags: PlatformFeatureFlag[] }>("/api/platform/feature-flags");
  return response.flags;
}

export async function getPlatformUsers(params: { search?: string; role?: string; status?: string; page?: number; pageSize?: number } = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.role) query.set("role", params.role);
  if (params.status) query.set("status", params.status);
  query.set("page", String(params.page ?? 1));
  query.set("pageSize", String(params.pageSize ?? 100));

  return apiClient.get<{ count: number; page: number; pageSize: number; users: PlatformUser[] }>(`/api/platform/users?${query.toString()}`);
}

export async function getPlatformRoles() {
  const response = await apiClient.get<{ count: number; roles: PlatformRole[] }>("/api/platform/roles");
  return response.roles;
}

export async function updatePlatformUserStatus(id: string, status: string) {
  const response = await apiClient.patch<{ user: Pick<PlatformUser, "id" | "status"> }>(`/api/platform/users/${id}/status`, { status });
  return response.user;
}

export async function updatePlatformUserRole(id: string, roleId: string) {
  const response = await apiClient.patch<{ user: PlatformUser }>(`/api/platform/users/${id}/role`, { roleId });
  return response.user;
}

export async function getTenants() {
  const response = await apiClient.get<{ module: string; count: number; tenants: TenantRecord[] }>("/api/tenants");
  return response.tenants;
}

export async function getTenant(id: string) {
  const response = await apiClient.get<{ tenant: TenantRecord }>(`/api/tenants/${id}`);
  return response.tenant;
}

export async function createTenant(payload: Pick<TenantRecord, "name" | "industry" | "status">) {
  const response = await apiClient.post<{ tenant: TenantRecord }>("/api/tenants", payload);
  return response.tenant;
}

export async function updateTenant(id: string, payload: Partial<Pick<TenantRecord, "name" | "industry">>) {
  const response = await apiClient.patch<{ tenant: TenantRecord }>(`/api/tenants/${id}`, payload);
  return response.tenant;
}

export async function updateTenantStatus(id: string, status: string) {
  const response = await apiClient.patch<{ tenant: TenantRecord }>(`/api/tenants/${id}/status`, { status });
  return response.tenant;
}

export async function getTenantSubscription(id: string) {
  const response = await apiClient.get<{ subscription: SubscriptionRecord | null }>(`/api/tenants/${id}/subscription`);
  return response.subscription;
}

export async function getSubscriptions() {
  const response = await apiClient.get<{ module: string; count: number; subscriptions: SubscriptionRecord[] }>("/api/subscriptions");
  return response.subscriptions;
}

export async function getSubscription(id: string) {
  const response = await apiClient.get<{ subscription: SubscriptionRecord }>(`/api/subscriptions/${id}`);
  return response.subscription;
}

export async function createSubscription(payload: Pick<SubscriptionRecord, "organization_id" | "plan" | "status" | "current_period_start" | "current_period_end" | "provider_subscription_id">) {
  const response = await apiClient.post<{ subscription: SubscriptionRecord }>("/api/subscriptions", payload);
  return response.subscription;
}

export async function updateSubscription(id: string, payload: Partial<Pick<SubscriptionRecord, "plan" | "status" | "current_period_start" | "current_period_end" | "provider_subscription_id">>) {
  const response = await apiClient.patch<{ subscription: SubscriptionRecord }>(`/api/subscriptions/${id}`, payload);
  return response.subscription;
}

export async function getBillingSubscriptionDashboard() {
  return apiClient.get<BillingSubscriptionDashboard>("/api/billing/subscription/dashboard");
}
