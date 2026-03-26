import { queryDb } from "../client.js";

export async function listTenantBranchesForOrganization(organizationId: string) {
  return queryDb<{
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
  }>(
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
}

export async function createTenantBranch(params: {
  organizationId: string;
  name: string;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
}) {
  const rows = await queryDb<{
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
  }>(
    `insert into tenant_branches (
       id, organization_id, name, address, city, country, latitude, longitude, phone
     ) values (
       gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8
     )
     returning id::text,
               organization_id::text,
               name,
               address,
               city,
               country,
               latitude::text,
               longitude::text,
               phone,
               created_at::text`,
    [
      params.organizationId,
      params.name,
      params.address ?? null,
      params.city ?? null,
      params.country ?? null,
      params.latitude ?? null,
      params.longitude ?? null,
      params.phone ?? null
    ]
  );

  return rows[0] ?? null;
}
