import { getFinanceKpis } from "./analyticsRepository.js";

export async function getTenantFinanceKpis(organizationId: string) {
  return getFinanceKpis(organizationId);
}
