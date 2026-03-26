import { queryDb } from "../client.js";

type TenantRow = {
  id: string;
  name: string;
  industry: string | null;
  subscription_plan: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
};

type TenantBranchRow = {
  id: string;
  organization_id: string;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  latitude: string | null;
  longitude: string | null;
  phone: string | null;
  created_at: string;
};

export async function getTenantById(organizationId: string) {
  try {
    const rows = await queryDb<TenantRow>(
      `select id::text,
              name,
              industry,
              subscription_plan,
              status,
              created_at::text,
              updated_at::text
         from organizations
        where id = $1`,
      [organizationId]
    );

    const row = rows?.[0];
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      name: row.name,
      industry: row.industry,
      subscription_plan: row.subscription_plan,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  } catch {
    return null;
  }
}

export async function listTenantBranches(organizationId: string) {
  const rows = await queryDb<TenantBranchRow>(
    `select id::text,
            organization_id::text,
            name,
            address,
            city,
            country,
            latitude::text,
            longitude::text,
            phone,
            created_at::text
       from tenant_branches
      where organization_id = $1
      order by created_at asc`,
    [organizationId]
  );

  return rows.map((row) => ({
    id: row.id,
    tenant_id: row.organization_id,
    name: row.name,
    address: row.address,
    city: row.city,
    country: row.country,
    latitude: row.latitude ? Number(row.latitude) : null,
    longitude: row.longitude ? Number(row.longitude) : null,
    phone: row.phone,
    created_at: row.created_at
  }));
}
