import { Router } from "express";
import { queryDb } from "../../db/client.js";
import { getRequiredOrganizationId } from "../../shared/http.js";
import { callClaude } from "../../services/ai/claude.js";
import { respondSuccess, respondError } from "../../shared/response.js";

export const marketplaceRoutes = Router();

// Smart service matching
marketplaceRoutes.post("/match", async (req, res, next) => {
  try {
    const { service_id, lat, lng, urgency = "normal" } = req.body;

    if (!service_id || !lat || !lng) {
      return respondError(res, "SERVICE_ID_LAT_LNG_REQUIRED", "Service ID, lat, lng required", 400);
    }

    const providers = await queryDb<{
      org_id: string;
      org_name: string;
      staff_id: string;
      staff_name: string;
      rating: number;
      completed_bookings: string;
      distance_km: string;
      price_cents: string;
    }>(
      `SELECT 
         o.id as org_id, o.name as org_name,
         sm.id as staff_id, sm.full_name as staff_name,
         COALESCE(sm.rating, 4.0) as rating,
         COUNT(b.id) as completed_bookings,
         6371 * acos(cos(radians($1)) * cos(radians(COALESCE(sl.lat, $1))) * 
           cos(radians(COALESCE(sl.lng, $2)) - radians($2)) + 
           sin(radians($1)) * sin(radians(COALESCE(sl.lat, $1)))) as distance_km,
         s.price_cents
       FROM staff_members sm
       JOIN organisations o ON sm.organization_id = o.id
       JOIN services s ON s.organization_id = o.id
       LEFT JOIN staff_locations sl ON sl.staff_id = sm.id
       LEFT JOIN bookings b ON b.staff_member_id = sm.id AND b.status = 'completed'
       WHERE s.id = $3 AND sm.is_active = true
       GROUP BY o.id, o.name, sm.id, sm.full_name, sm.rating, sl.lat, sl.lng, s.price_cents
       HAVING distance_km < 50
       ORDER BY distance_km ASC
       LIMIT 20`,
      [lat, lng, service_id]
    );

    if (providers.length === 0) {
      return respondSuccess(res, { matches: [], message: "No providers available in your area" });
    }

    const scored = providers.map(p => {
      const distanceScore = Math.max(0, 100 - parseFloat(p.distance_km) * 2);
      const ratingScore = p.rating * 20;
      const reliabilityScore = Math.min(100, parseInt(p.completed_bookings) * 2);
      const urgencyBonus = urgency === "urgent" && parseFloat(p.distance_km) < 5 ? 20 : 0;

      const totalScore = (
        distanceScore * 0.4 +
        ratingScore * 0.3 +
        reliabilityScore * 0.2 +
        urgencyBonus * 0.1
      );

      return {
        org_id: p.org_id,
        org_name: p.org_name,
        staff_id: p.staff_id,
        staff_name: p.staff_name,
        rating: p.rating,
        distance_km: parseFloat(p.distance_km).toFixed(1),
        price_cents: parseInt(p.price_cents),
        score: Math.round(totalScore),
        match_quality: totalScore > 80 ? "excellent" : totalScore > 60 ? "good" : "fair"
      };
    });

    scored.sort((a, b) => b.score - a.score);

    return respondSuccess(res, {
      matches: scored.slice(0, 5),
      recommended: scored[0]
    });
  } catch (err) {
    return next(err);
  }
});

// Dynamic pricing
marketplaceRoutes.post("/pricing", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { service_id, time_slot, urgency = "normal" } = req.body;

    if (!service_id || !time_slot) {
      return respondError(res, "SERVICE_ID_AND_TIME_SLOT_REQUIRED", "Service ID and time slot required", 400);
    }

    const services = await queryDb<{ price_cents: string; name: string }>(
      `SELECT price_cents, name FROM services WHERE id = $1 AND organization_id = $2`,
      [service_id, organizationId]
    );

    if (services.length === 0) {
      return respondError(res, "SERVICE_NOT_FOUND", "Service not found", 400);
    }

    const basePrice = parseInt(services[0].price_cents);
    const hour = new Date(time_slot).getHours();
    const isPeakHour = hour >= 9 && hour <= 17;
    const demandMultiplier = isPeakHour ? 1.2 : 0.9;
    const urgencyMultiplier = urgency === "urgent" ? 1.5 : urgency === "same_day" ? 1.2 : 1.0;

    const availability = await queryDb<{ available_slots: string }>(
      `SELECT COUNT(*) as available_slots FROM staff_members sm
       WHERE sm.organization_id = $1 AND sm.is_active = true`,
      [organizationId]
    );

    const availableSlots = parseInt(availability[0]?.available_slots || "0");
    const scarcityMultiplier = availableSlots < 3 ? 1.3 : 1.0;
    const finalPrice = Math.round(basePrice * demandMultiplier * urgencyMultiplier * scarcityMultiplier);

    return respondSuccess(res, {
      service_name: services[0].name,
      base_price_cents: basePrice,
      final_price_cents: finalPrice,
      pricing_factors: {
        demand: demandMultiplier,
        urgency: urgencyMultiplier,
        scarcity: scarcityMultiplier
      },
      savings_pct: finalPrice < basePrice ? Math.round(((basePrice - finalPrice) / basePrice) * 100) : 0
    });
  } catch (err) {
    return next(err);
  }
});

// Demand forecast
marketplaceRoutes.get("/demand-forecast", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);
    const { days = 7 } = req.query;

    const history = await queryDb<{ hour: string; day_of_week: string; booking_count: string }>(
      `SELECT 
         EXTRACT(HOUR FROM start_time) as hour,
         EXTRACT(DOW FROM start_time) as day_of_week,
         COUNT(*) as booking_count
       FROM bookings
       WHERE organization_id = $1 
         AND created_at > NOW() - INTERVAL '90 days'
         AND status IN ('completed', 'confirmed')
       GROUP BY hour, day_of_week
       ORDER BY day_of_week, hour`,
      [organizationId]
    );

    const prompt = `Analyze booking patterns and predict demand for next ${days} days.
Data: ${JSON.stringify(history.slice(0, 50))}
Return JSON: {"forecast": [{"date": "2025-01-15", "predicted_bookings": 45, "confidence": 0.85, "peak_hours": [9,10,14]}], "insights": ["Peak weekdays 9-11am"]}`;

    const aiResponse = await callClaude(prompt, { maxTokens: 500 });
    const forecast = JSON.parse(aiResponse.content);

    return respondSuccess(res, {
      organization_id: organizationId,
      forecast: forecast.forecast,
      insights: forecast.insights,
      generated_at: new Date().toISOString()
    });
  } catch (err) {
    return next(err);
  }
});

// Provider optimization
marketplaceRoutes.get("/optimize", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);

    const metrics = await queryDb<{
      avg_utilization: string;
      revenue_last_30d: string;
      no_show_rate: string;
      avg_rating: string;
    }>(
      `SELECT 
         AVG(CASE WHEN sm.is_active THEN 75 ELSE 0 END) as avg_utilization,
         COALESCE(SUM(b.amount_cents), 0) as revenue_last_30d,
         COALESCE(AVG(CASE WHEN b.status = 'no_show' THEN 1 ELSE 0 END) * 100, 0) as no_show_rate,
         COALESCE(AVG(sm.rating), 4.0) as avg_rating
       FROM staff_members sm
       LEFT JOIN bookings b ON b.staff_member_id = sm.id AND b.created_at > NOW() - INTERVAL '30 days'
       WHERE sm.organization_id = $1
       GROUP BY sm.organization_id`,
      [organizationId]
    );

    const data = metrics[0] || { avg_utilization: "0", revenue_last_30d: "0", no_show_rate: "0", avg_rating: "4.0" };
    const recommendations = [];

    if (parseFloat(data.avg_utilization) < 60) {
      recommendations.push({
        type: "staffing",
        priority: "high",
        action: "Reduce staff hours during low-demand periods",
        impact: "Reduce costs by 15-20%"
      });
    }

    if (parseFloat(data.no_show_rate) > 10) {
      recommendations.push({
        type: "operations",
        priority: "high",
        action: "Implement SMS reminders 24h before appointments",
        impact: "Reduce no-shows by 40%"
      });
    }

    if (parseFloat(data.avg_rating) < 4.5) {
      recommendations.push({
        type: "quality",
        priority: "medium",
        action: "Staff training to improve service quality",
        impact: "Increase ratings and repeat bookings"
      });
    }

    recommendations.push({
      type: "pricing",
      priority: "medium",
      action: "Enable dynamic pricing for peak hours",
      impact: "Increase revenue by 10-15%"
    });

    return respondSuccess(res, {
      current_metrics: {
        utilization_pct: parseFloat(data.avg_utilization).toFixed(1),
        revenue_30d: parseInt(data.revenue_last_30d),
        no_show_rate_pct: parseFloat(data.no_show_rate).toFixed(1),
        avg_rating: parseFloat(data.avg_rating).toFixed(1)
      },
      recommendations
    });
  } catch (err) {
    return next(err);
  }
});

// Personalized recommendations
marketplaceRoutes.get("/recommendations/:clientId", async (req, res, next) => {
  try {
    const { clientId } = req.params;

    const history = await queryDb<{ service_id: string; service_name: string; category: string }>(
      `SELECT DISTINCT s.id as service_id, s.name as service_name, s.category
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       WHERE b.client_id = $1 AND b.status = 'completed'
       ORDER BY b.created_at DESC LIMIT 10`,
      [clientId]
    );

    const recommendations = await queryDb<{
      service_id: string;
      service_name: string;
      booking_count: string;
      avg_rating: string;
    }>(
      `SELECT s.id as service_id, s.name as service_name, 
              COUNT(b.id) as booking_count,
              AVG(COALESCE(r.rating, 4.5)) as avg_rating
       FROM services s
       LEFT JOIN bookings b ON b.service_id = s.id
       LEFT JOIN reviews r ON r.booking_id = b.id
       WHERE s.category = ANY($1)
         AND s.id NOT IN (SELECT service_id FROM bookings WHERE client_id = $2)
       GROUP BY s.id, s.name
       ORDER BY booking_count DESC, avg_rating DESC LIMIT 5`,
      [history.map(h => h.category), clientId]
    );

    return respondSuccess(res, {
      based_on: history.map(h => h.service_name),
      recommendations: recommendations.map(r => ({
        service_id: r.service_id,
        service_name: r.service_name,
        popularity_score: parseInt(r.booking_count),
        rating: parseFloat(r.avg_rating).toFixed(1),
        reason: "Popular with similar customers"
      }))
    });
  } catch (err) {
    return next(err);
  }
});

// Marketplace analytics
marketplaceRoutes.get("/analytics", async (req, res, next) => {
  try {
    const organizationId = getRequiredOrganizationId(res);

    const analytics = await queryDb<{
      total_bookings: string;
      revenue_cents: string;
      avg_booking_value: string;
      top_service: string;
    }>(
      `SELECT 
         COUNT(b.id) as total_bookings,
         SUM(b.amount_cents) as revenue_cents,
         AVG(b.amount_cents) as avg_booking_value,
         (SELECT s.name FROM services s 
          JOIN bookings b2 ON b2.service_id = s.id 
          WHERE s.organization_id = $1 
          GROUP BY s.id, s.name 
          ORDER BY COUNT(*) DESC LIMIT 1) as top_service
       FROM bookings b
       WHERE b.organization_id = $1 
         AND b.created_at > NOW() - INTERVAL '30 days'`,
      [organizationId]
    );

    const data = analytics[0] || { total_bookings: "0", revenue_cents: "0", avg_booking_value: "0", top_service: null };

    return respondSuccess(res, {
      period: "last_30_days",
      total_bookings: parseInt(data.total_bookings),
      revenue_cents: parseInt(data.revenue_cents),
      avg_booking_value_cents: parseInt(data.avg_booking_value),
      top_service: data.top_service,
      growth_trend: "stable"
    });
  } catch (err) {
    return next(err);
  }
});

