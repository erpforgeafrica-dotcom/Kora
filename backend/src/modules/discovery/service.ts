import { queryDb } from "../../db/client.js";
import {
  getMarketplaceListingBySlug,
  listFeaturedMarketplaceListings,
  listMarketplaceListingServices,
  searchMarketplaceListings
} from "../../db/repositories/discoveryRepository.js";
import { listDiscoveryCategoriesRepository } from "../../db/repositories/serviceCatalogRepository.js";

export async function listDiscoveryCategories() {
  return listDiscoveryCategoriesRepository();
}

export async function getFeaturedVenues(city?: string) {
  return listFeaturedMarketplaceListings(city);
}

export async function searchDiscovery(params: {
  query?: string;
  city?: string;
  category?: string;
  rating?: number;
}) {
  return searchMarketplaceListings(params);
}

export async function getVenueBySlug(slug: string) {
  return getMarketplaceListingBySlug(slug);
}

export async function getVenueServices(slug: string) {
  return listMarketplaceListingServices(slug);
}

export async function listReviewsForOrganization(organizationId: string) {
  return queryDb<{
    id: string;
    rating: number;
    body: string | null;
    ai_sentiment: string | null;
    client_name: string;
    created_at: string;
  }>(
    `select r.id::text,
            r.rating,
            r.body,
            r.ai_sentiment,
            c.full_name as client_name,
            r.created_at::text
       from reviews r
       join clients c on c.id = r.client_id
      where r.organization_id = $1
        and r.is_published = true
      order by r.created_at desc
      limit 50`,
    [organizationId]
  );
}

export async function createReview(params: {
  organizationId: string;
  clientId: string;
  bookingId?: string | null;
  staffMemberId?: string | null;
  rating: number;
  body?: string | null;
}) {
  const rows = await queryDb<{ id: string; created_at: string }>(
    `insert into reviews (
       id, organization_id, client_id, booking_id, staff_member_id, rating, body, is_verified
     ) values (
       gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7
     )
     returning id::text, created_at::text`,
    [
      params.organizationId,
      params.clientId,
      params.bookingId ?? null,
      params.staffMemberId ?? null,
      params.rating,
      params.body ?? null,
      Boolean(params.bookingId)
    ]
  );

  await queryDb(
    `update venue_profiles vp
        set rating = coalesce((
              select round(avg(r.rating)::numeric, 2)
                from reviews r
               where r.organization_id = vp.organization_id
                 and r.is_published = true
            ), 0),
            review_count = (
              select count(*)
                from reviews r
               where r.organization_id = vp.organization_id
                 and r.is_published = true
            ),
            updated_at = now()
      where vp.organization_id = $1`,
    [params.organizationId]
  );

  return rows[0];
}

export async function createPromotion(params: {
  organizationId: string;
  code?: string | null;
  type: string;
  value: number;
  minSpend?: number;
  applicableServiceIds?: string[];
  maxUses?: number | null;
  validFrom?: string | null;
  validUntil?: string | null;
}) {
  const rows = await queryDb<{ id: string; code: string | null; type: string; value: string }>(
    `insert into promotions (
       id, organization_id, code, type, value, min_spend, applicable_service_ids,
       max_uses, valid_from, valid_until
     ) values (
       gen_random_uuid(), $1, $2, $3, $4, $5, $6::uuid[], $7, $8::timestamptz, $9::timestamptz
     )
     returning id::text, code, type, value::text`,
    [
      params.organizationId,
      params.code ?? null,
      params.type,
      params.value,
      params.minSpend ?? 0,
      params.applicableServiceIds ?? [],
      params.maxUses ?? null,
      params.validFrom ?? null,
      params.validUntil ?? null
    ]
  );

  return rows[0];
}

export async function listPromotionsForOrganization(organizationId: string) {
  return queryDb<{
    id: string;
    code: string | null;
    type: string;
    value: string;
    min_spend: string;
    max_uses: number | null;
    uses_count: number;
    valid_from: string | null;
    valid_until: string | null;
    is_active: boolean;
  }>(
    `select id::text,
            code,
            type,
            value::text,
            min_spend::text,
            max_uses,
            uses_count,
            valid_from::text,
            valid_until::text,
            is_active
       from promotions
      where organization_id = $1
      order by coalesce(valid_until, now()) desc, code asc nulls last`,
    [organizationId]
  );
}

export async function validatePromotion(params: {
  organizationId: string;
  code: string;
  serviceId?: string | null;
  subtotal?: number;
}) {
  const rows = await queryDb<{
    id: string;
    type: string;
    value: string;
    min_spend: string;
    applicable_service_ids: string[] | null;
    uses_count: number;
    max_uses: number | null;
  }>(
    `select id::text, type, value::text, min_spend::text, applicable_service_ids, uses_count, max_uses
       from promotions
      where organization_id = $1
        and code = $2
        and is_active = true
        and (valid_from is null or valid_from <= now())
        and (valid_until is null or valid_until >= now())
      limit 1`,
    [params.organizationId, params.code]
  );

  const promotion = rows[0];
  if (!promotion) {
    return { valid: false, error: "PROMOTION_NOT_FOUND" };
  }
  if (promotion.max_uses !== null && promotion.uses_count >= promotion.max_uses) {
    return { valid: false, error: "PROMOTION_EXHAUSTED" };
  }
  if (params.subtotal !== undefined && params.subtotal < Number(promotion.min_spend)) {
    return { valid: false, error: "PROMOTION_MIN_SPEND_NOT_MET" };
  }
  if (
    params.serviceId &&
    Array.isArray(promotion.applicable_service_ids) &&
    promotion.applicable_service_ids.length > 0 &&
    !promotion.applicable_service_ids.includes(params.serviceId)
  ) {
    return { valid: false, error: "PROMOTION_NOT_APPLICABLE" };
  }

  return {
    valid: true,
    promotion: {
      id: promotion.id,
      type: promotion.type,
      value: Number(promotion.value)
    }
  };
}
