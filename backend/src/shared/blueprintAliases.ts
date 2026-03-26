export function withTenantAlias<T extends Record<string, unknown>>(payload: T, organizationId: string) {
  return {
    ...payload,
    tenant_id: organizationId,
    tenant: { id: organizationId }
  };
}

export function withCustomerAlias<T extends Record<string, unknown>>(payload: T, customerId?: string | null) {
  return {
    ...payload,
    customer_id: customerId ?? null
  };
}

export function withStaffProfileAlias<T extends Record<string, unknown>>(payload: T, staffProfileId?: string | null) {
  return {
    ...payload,
    staff_profile_id: staffProfileId ?? null
  };
}
