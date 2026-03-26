import { queryDb } from "../client.js";

type ServiceCatalogRow = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  category_id: string | null;
  category_label: string | null;
  category_slug: string | null;
  image_url: string | null;
  min_price: string | null;
  max_price: string | null;
  price_cents: number | null;
  currency: string | null;
};

type CategoryDiscoveryRow = {
  id: string;
  slug: string;
  label: string;
  icon: string | null;
  venue_count: string;
};

export async function listTenantServices(organizationId: string) {
  return queryDb<ServiceCatalogRow>(
    `select s.id::text,
            s.organization_id::text,
            s.name,
            s.description,
            s.duration_minutes,
            s.category_id::text,
            sc.label as category_label,
            sc.slug as category_slug,
            s.image_url,
            s.min_price::text,
            s.max_price::text,
            s.price_cents,
            s.currency
       from services s
       left join service_categories sc on sc.id = s.category_id
      where s.organization_id = $1
        and s.is_active = true
      order by sc.label nulls last, s.name asc`,
    [organizationId]
  );
}

export async function listDiscoveryCategoriesRepository() {
  return queryDb<CategoryDiscoveryRow>(
    `select sc.id::text,
            sc.slug,
            sc.label,
            sc.icon,
            count(distinct vp.id)::text as venue_count
       from service_categories sc
       left join services s on s.category_id = sc.id and s.is_active = true
       left join venue_profiles vp on vp.organization_id = s.organization_id and vp.is_published = true
      group by sc.id, sc.slug, sc.label, sc.icon
      order by sc.label asc`
  );
}

export function toBlueprintServiceContract(service: ServiceCatalogRow) {
  return {
    id: service.id,
    tenant_id: service.organization_id,
    category_id: service.category_id,
    name: service.name,
    description: service.description,
    duration_minutes: service.duration_minutes,
    category_label: service.category_label,
    category_slug: service.category_slug,
    image_url: service.image_url,
    min_price: service.min_price ? Number(service.min_price) : null,
    max_price: service.max_price ? Number(service.max_price) : null,
    price: service.min_price
      ? Number(service.min_price)
      : service.max_price
        ? Number(service.max_price)
        : Number(service.price_cents ?? 0) / 100,
    price_cents: service.price_cents,
    currency: service.currency
  };
}
