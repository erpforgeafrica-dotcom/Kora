import { listTenantServices } from "../../db/repositories/serviceCatalogRepository.js";

export async function listOrganizationServices(organizationId: string) {
  return listTenantServices(organizationId);
}
