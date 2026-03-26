import { Router } from "express";
import { toBlueprintServiceContract } from "../../db/repositories/serviceCatalogRepository.js";
import { withTenantAlias } from "../../shared/blueprintAliases.js";
import { getRequiredOrganizationId } from "../../shared/http.js";
import { respondSuccess, respondError } from "../../shared/response.js";
import {
  createPromotion,
  createReview,
  getFeaturedVenues,
  getVenueBySlug,
  getVenueServices,
  listPromotionsForOrganization,
  listDiscoveryCategories,
  listReviewsForOrganization,
  searchDiscovery,
  validatePromotion
} from "./service.js";

export const discoveryRoutes = Router();

discoveryRoutes.get("/categories", async (_req, res, next) => {
  try {
    const categories = await listDiscoveryCategories();
    return respondSuccess(res, {
      count: categories.length,
      categories: categories.map((category) => ({
        id: category.id,
        slug: category.slug,
        label: category.label,
        icon: category.icon,
        venue_count: Number(category.venue_count)
      }))
    });
  } catch (error) {
    return next(error);
  }
});

discoveryRoutes.get("/featured", async (req, res, next) => {
  try {
    const city = typeof req.query.city === "string" ? req.query.city : undefined;
    const venues = await getFeaturedVenues(city);
    return respondSuccess(res, {
      count: venues.length,
      venues: venues.map((venue) => ({
        ...venue,
        tenant_id: venue.organization_id,
        rating: Number(venue.rating),
        top_service_price: venue.top_service_price ? Number(venue.top_service_price) : null
      }))
    });
  } catch (error) {
    return next(error);
  }
});

discoveryRoutes.get("/search", async (req, res, next) => {
  try {
    const results = await searchDiscovery({
      query: typeof req.query.q === "string" ? req.query.q : undefined,
      city: typeof req.query.city === "string" ? req.query.city : undefined,
      category: typeof req.query.category === "string" ? req.query.category : undefined,
      rating: typeof req.query.rating === "string" ? Number(req.query.rating) : undefined
    });

    return respondSuccess(res, {
      count: results.length,
      venues: results.map((venue) => ({
        id: venue.id,
        tenant_id: venue.organization_id,
        slug: venue.slug,
        display_name: venue.display_name,
        city: venue.city,
        rating: Number(venue.rating),
        review_count: venue.review_count,
        cover_image_url: venue.cover_image_url,
        matching_services: venue.matching_services.map((name) => ({ name }))
      }))
    });
  } catch (error) {
    return next(error);
  }
});

discoveryRoutes.get("/venues/:slug", async (req, res, next) => {
  try {
    const venue = await getVenueBySlug(req.params.slug);
    if (!venue) {
      return respondError(res, "VENUE_NOT_FOUND", "Venue not found", 404);
    }
    return respondSuccess(res, {
      ...venue,
      tenant_id: venue.organization_id,
      rating: Number(venue.rating)
    });
  } catch (error) {
    return next(error);
  }
});

discoveryRoutes.get("/venues/:slug/services", async (req, res, next) => {
  try {
    const services = await getVenueServices(req.params.slug);
    return respondSuccess(res, {
      ...withTenantAlias({}, services[0]?.organization_id ?? ""),
      count: services.length,
      services: services.map((service) => ({
        ...toBlueprintServiceContract({
          ...service,
          category_id: null,
          currency: null
        })
      }))
    });
  } catch (error) {
    return next(error);
  }
});

discoveryRoutes.get("/reviews/:organizationId", async (req, res, next) => {
  try {
    const reviews = await listReviewsForOrganization(req.params.organizationId);
    return respondSuccess(res, { count: reviews.length, reviews });
  } catch (error) {
    return next(error);
  }
});

discoveryRoutes.post("/reviews", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const review = await createReview({
      organizationId,
      clientId: String(req.body?.client_id ?? ""),
      bookingId: req.body?.booking_id ? String(req.body.booking_id) : null,
      staffMemberId: req.body?.staff_member_id ? String(req.body.staff_member_id) : null,
      rating: Number(req.body?.rating),
      body: req.body?.body ? String(req.body.body) : null
    });

    return respondSuccess(res, review, 201);
  } catch (error) {
    return next(error);
  }
});

discoveryRoutes.post("/promotions", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const promotion = await createPromotion({
      organizationId,
      code: req.body?.code ? String(req.body.code) : null,
      type: String(req.body?.type ?? ""),
      value: Number(req.body?.value ?? 0),
      minSpend: Number(req.body?.min_spend ?? 0),
      applicableServiceIds: Array.isArray(req.body?.applicable_service_ids)
        ? req.body.applicable_service_ids.map((value: unknown) => String(value))
        : [],
      maxUses: req.body?.max_uses ? Number(req.body.max_uses) : null,
      validFrom: req.body?.valid_from ? String(req.body.valid_from) : null,
      validUntil: req.body?.valid_until ? String(req.body.valid_until) : null
    });

    return respondSuccess(res, promotion, 201);
  } catch (error) {
    return next(error);
  }
});

discoveryRoutes.get("/promotions", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const promotions = await listPromotionsForOrganization(organizationId);
    return respondSuccess(res,
      withTenantAlias(
        {
          count: promotions.length,
          promotions: promotions.map((promotion) => ({
            ...promotion,
            value: Number(promotion.value),
            min_spend: Number(promotion.min_spend)
          }))
        },
        organizationId
      )
    );
  } catch (error) {
    return next(error);
  }
});

discoveryRoutes.post("/promotions/validate", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const result = await validatePromotion({
      organizationId,
      code: String(req.body?.code ?? ""),
      serviceId: req.body?.service_id ? String(req.body.service_id) : null,
      subtotal: typeof req.body?.subtotal === "number" ? req.body.subtotal : undefined
    });

    return respondSuccess(res, result);
  } catch (error) {
    return next(error);
  }
});

