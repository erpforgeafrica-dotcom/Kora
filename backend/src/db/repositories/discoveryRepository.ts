import { queryDb } from "../client.js";

export async function listFeaturedMarketplaceListings(city?: string) {
  return queryDb<{
    id: string;
    organization_id: string;
    slug: string;
    display_name: string;
    city: string | null;
    rating: string;
    review_count: number;
    cover_image_url: string | null;
    opens_at: string | null;
    closes_at: string | null;
    top_service_name: string | null;
    top_service_price: string | null;
  }>(
    `select vp.id::text,
            vp.organization_id::text,
            vp.slug,
            vp.display_name,
            vp.city,
            vp.rating::text,
            vp.review_count,
            vp.cover_image_url,
            vp.opens_at::text,
            vp.closes_at::text,
            s.name as top_service_name,
            coalesce(s.min_price, s.max_price, s.price_cents::numeric / 100)::text as top_service_price
       from venue_profiles vp
       left join lateral (
         select s.name, s.min_price, s.max_price, s.price_cents
           from services s
          where s.organization_id = vp.organization_id
            and s.is_active = true
          order by s.created_at asc
          limit 1
       ) s on true
      where vp.is_published = true
        and ($1::text is null or vp.city ilike $1)
      order by vp.rating desc, vp.review_count desc, vp.display_name asc
      limit 12`,
    [city ? `%${city}%` : null]
  );
}

export async function searchMarketplaceListings(params: {
  query?: string;
  city?: string;
  category?: string;
  rating?: number;
}) {
  return queryDb<{
    id: string;
    organization_id: string;
    slug: string;
    display_name: string;
    city: string | null;
    rating: string;
    review_count: number;
    cover_image_url: string | null;
    matching_services: string[];
  }>(
    `select vp.id::text,
            vp.organization_id::text,
            vp.slug,
            vp.display_name,
            vp.city,
            vp.rating::text,
            vp.review_count,
            vp.cover_image_url,
            array_remove(array_agg(distinct s.name), null) as matching_services
       from venue_profiles vp
       join services s on s.organization_id = vp.organization_id and s.is_active = true
       left join service_categories sc on sc.id = s.category_id
      where vp.is_published = true
        and ($1::text = '' or s.search_vector @@ plainto_tsquery('english', $1) or vp.display_name ilike '%' || $1 || '%')
        and ($2::text = '' or vp.city ilike '%' || $2 || '%')
        and ($3::text = '' or sc.slug = $3)
        and ($4::numeric is null or vp.rating >= $4)
      group by vp.id
      order by vp.rating desc, vp.review_count desc, vp.display_name asc
      limit 20`,
    [params.query ?? "", params.city ?? "", params.category ?? "", params.rating ?? null]
  );
}

export async function getMarketplaceListingBySlug(slug: string) {
  const rows = await queryDb<{
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
    rating: string;
    review_count: number;
    features: string[] | null;
    opens_at: string | null;
    closes_at: string | null;
  }>(
    `select id::text,
            organization_id::text,
            display_name,
            slug,
            tagline,
            description,
            cover_image_url,
            logo_url,
            address_line1,
            city,
            postcode,
            country,
            phone,
            email,
            rating::text,
            review_count,
            features,
            opens_at::text,
            closes_at::text
       from venue_profiles
      where slug = $1 and is_published = true`,
    [slug]
  );

  return rows[0] ?? null;
}

export async function listMarketplaceListingServices(slug: string) {
  return queryDb<{
    id: string;
    organization_id: string;
    name: string;
    description: string | null;
    duration_minutes: number;
    category_label: string | null;
    category_slug: string | null;
    image_url: string | null;
    min_price: string | null;
    max_price: string | null;
    price_cents: number | null;
  }>(
    `select s.id::text,
            s.organization_id::text,
            s.name,
            s.description,
            s.duration_minutes,
            sc.label as category_label,
            sc.slug as category_slug,
            s.image_url,
            s.min_price::text,
            s.max_price::text,
            s.price_cents
       from venue_profiles vp
       join services s on s.organization_id = vp.organization_id
       left join service_categories sc on sc.id = s.category_id
      where vp.slug = $1
        and vp.is_published = true
        and s.is_active = true
      order by sc.label nulls last, s.name asc`,
    [slug]
  );
}
