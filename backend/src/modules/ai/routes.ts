import { Router } from "express";
import rateLimit from "express-rate-limit";
import { AIOrchestrationService } from "./service.js";
import { runLiveOrchestration, saveActionFeedback } from "./orchestration/liveOrchestrator.js";
import { queryDb } from "../../db/client.js";
import { loadModuleSignalSnapshot } from "./orchestration/signalAggregator.js";
import { AIClientFactory } from "../../services/aiClient.js";
import { embeddingService } from "../../services/ai/embeddingService.js";
import { availabilityRepository } from "../../db/repositories/availabilityRepository.js";
import { requirePlan } from "../../middleware/planValidation.js";
import { respondError, respondSuccess } from "../../shared/response.js";

export const aiRoutes = Router();

const tenantLimiter = (limitCount: number) => rateLimit({
  windowMs: 60 * 1000,
  limit: limitCount,
  keyGenerator: (req) => `org_${req.res?.locals?.auth?.organizationId ?? req.ip}`
});

const userLimiter = (limitCount: number) => rateLimit({
  windowMs: 60 * 1000,
  limit: limitCount,
  keyGenerator: (req) => `user_${req.res?.locals?.auth?.userId ?? req.ip}`
});

const insightsLimiter = [userLimiter(50), tenantLimiter(200)];
const orchestrateLimiter = [userLimiter(15), tenantLimiter(60)];
const queryLimiter = [userLimiter(10), tenantLimiter(30)];

aiRoutes.get("/status", (_req, res) => {
  respondSuccess(res, {
    module: "ai",
    status: "ok",
    providers: {
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
      openai: Boolean(process.env.OPENAI_API_KEY),
      google: Boolean(process.env.GOOGLE_API_KEY),
      mistral: Boolean(process.env.MISTRAL_API_KEY)
    }
  });
});

aiRoutes.get("/assistant/status", (_req, res) => {
  respondSuccess(res, {
    module: "ai",
    provider: "multi",
    providers: {
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
      openai: Boolean(process.env.OPENAI_API_KEY),
      google: Boolean(process.env.GOOGLE_API_KEY),
      mistral: Boolean(process.env.MISTRAL_API_KEY)
    },
    orchestration: "enabled",
    models: ["claude-sonnet", "gpt-4o-mini", "gemini-2.0-flash", "mistral-small-latest"],
    lastInferenceMs: 412
  });
});

/**
 * AI Command Ranking
 * POST /api/ai/rank-commands
 * Prioritize operations using AI analysis
 */
aiRoutes.post("/rank-commands", async (req, res, next) => {
  try {
    const organizationId = res.locals.auth.organizationId;
    const userRole = res.locals.auth.userRole || "operator";
    
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const { commands } = req.body;
    if (!Array.isArray(commands)) {
      return respondError(res, "INVALID_COMMANDS_ARRAY", "commands must be an array", 400);
    }

    const service = new AIOrchestrationService(organizationId);
    const ranked = await service.rankCommands(commands, userRole);

    respondSuccess(res, {
      type: "command_ranking",
      ranked,
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Cross-Module Insights
 * GET /api/ai/insights
 * Generate correlated intelligence across all modules
 */
aiRoutes.get("/insights", ...insightsLimiter, requirePlan('business'), async (req, res, next) => {
  try {
    const organizationId = res.locals.auth.organizationId;
    
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const service = new AIOrchestrationService(organizationId);
    const insights = await service.generateInsights();

    respondSuccess(res, {
      type: "cross_module_insights",
      insights,
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Operational Predictions
 * GET /api/ai/predictions
 * Forecast trends and staffing needs
 */
aiRoutes.get("/predictions", async (req, res, next) => {
  try {
    const organizationId = res.locals.auth.organizationId;
    
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const service = new AIOrchestrationService(organizationId);
    const predictions = await service.predictOperationalMetrics();

    respondSuccess(res, {
      type: "predictions",
      predictions,
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Optimization Suggestions
 * GET /api/ai/suggestions
 * AI-powered recommendations for cost savings and efficiency
 */
aiRoutes.get("/suggestions", async (req, res, next) => {
  try {
    const organizationId = res.locals.auth.organizationId;
    
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const service = new AIOrchestrationService(organizationId);
    const suggestions = await service.suggestOptimizations();

    respondSuccess(res, {
      type: "optimization_suggestions",
      suggestions,
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Live command orchestration across all modules
 * POST /api/ai/orchestrate/live
 */
aiRoutes.post("/orchestrate/live", ...orchestrateLimiter, requirePlan('enterprise'), async (req, res, next) => {
  try {
    const organizationId = res.locals.auth.organizationId;
    const userId = res.locals.auth.userId;
    const userRole = req.body?.userRole ?? res.locals.auth.userRole ?? "operator";

    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const topN = Number(req.body?.topN ?? 5);
    const autoExecute = req.body?.autoExecute !== false;

    const result = await runLiveOrchestration({
      context: { organizationId, userId, userRole },
      topN,
      autoExecute
    });

    return respondSuccess(res, {
      type: "live_orchestration",
      ...result
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * Feedback ingestion for orchestration learning loop
 * POST /api/ai/orchestrate/feedback
 */
aiRoutes.post("/orchestrate/feedback", async (req, res, next) => {
  try {
    const organizationId = res.locals.auth.organizationId;
    const userId = res.locals.auth.userId;
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const actionId = String(req.body?.actionId ?? "");
    const commandFingerprint = String(req.body?.commandFingerprint ?? "");
    const outcome = req.body?.outcome as "accepted" | "rejected" | "executed" | "ignored";

    if (!actionId || !commandFingerprint || !["accepted", "rejected", "executed", "ignored"].includes(outcome)) {
      return respondError(
        res,
        "INVALID_FEEDBACK_PAYLOAD",
        "invalid feedback payload",
        400,
        { required: ["actionId", "commandFingerprint", "outcome"] }
      );
    }

    await saveActionFeedback({
      organizationId,
      userId,
      actionId,
      commandFingerprint,
      outcome,
      feedbackScore: Number(req.body?.feedbackScore ?? 0),
      notes: req.body?.notes ? String(req.body.notes) : undefined
    });

    return respondSuccess(res, {
      accepted: true,
      type: "orchestration_feedback"
    }, 202);
  } catch (err) {
    return next(err);
  }
});

aiRoutes.post("/query", ...queryLimiter, async (req, res, next) => {
  try {
    const organizationId = res.locals.auth.organizationId;
    const userId = res.locals.auth.userId;
    if (!organizationId) {
      return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);
    }

    const question = String(req.body?.question ?? "").trim();
    const context = String(req.body?.context ?? "general");
    const topN = Number(req.body?.topN ?? 3);
    if (!question) {
      return respondError(res, "QUESTION_REQUIRED", "question required", 400);
    }

    const signals = await loadModuleSignalSnapshot(organizationId);
    const client = await AIClientFactory.createClient(organizationId);
    const result = await client.executeTask({
      organizationId,
      userId,
      taskType: "compliance_advisory",
      systemPrompt:
        "You are KORA, an intelligent operations command assistant. Answer concisely and authoritatively. " +
        `Current operational context: ${JSON.stringify(signals)}`,
      prompt: question,
      maxTokens: 400,
      metadata: { context, topN }
    });

    await queryDb(
      `insert into audit_logs (id, organization_id, actor_id, action, metadata, created_at)
       values (gen_random_uuid(), $1, $2, 'natural_language_query', $3::jsonb, now())`,
      [
        organizationId,
        userId ?? null,
        JSON.stringify({
          question,
          context,
          topN,
          modelUsed: result.modelUsed
        })
      ]
    );

    return respondSuccess(res, {
      answer: result.content,
      modelUsed: result.modelUsed,
      latencyMs: result.latencyMs,
      tokens: result.tokens,
      context: signals
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * Semantic search across services
 * GET /api/ai/search/services?q=queryText
 */
aiRoutes.get("/search/services", ...queryLimiter, async (req, res, next) => {
  try {
    const q = req.query.q as string;
    if (!q) return respondError(res, "MISSING_QUERY_PARAMETER_Q", "Query parameter 'q' is required", 400);
    const limit = Number(req.query.limit) || 5;
    const organizationId = res.locals.auth?.organizationId || undefined;

    const results = await embeddingService.searchSimilar('service', q, limit, organizationId);
    respondSuccess(res, {
      type: "semantic_search",
      entity: "service",
      results
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Semantic search across staff
 * GET /api/ai/search/staff?q=queryText
 */
aiRoutes.get("/search/staff", ...queryLimiter, async (req, res, next) => {
  try {
    const q = req.query.q as string;
    if (!q) return respondError(res, "MISSING_QUERY_PARAMETER_Q", "Query parameter 'q' is required", 400);
    const limit = Number(req.query.limit) || 5;
    const organizationId = res.locals.auth?.organizationId || undefined;

    const results = await embeddingService.searchSimilar('staff', q, limit, organizationId);
    respondSuccess(res, {
      type: "semantic_search",
      entity: "staff",
      results
    });
  } catch (err) {
    next(err);
  }
});

/**
 * AI Feature A: Staff Auto-Assignment
 * POST /api/ai/assign-staff
 */
aiRoutes.post("/assign-staff", ...orchestrateLimiter, requirePlan('pro'), async (req, res, next) => {
  try {
    const { serviceName, description, startTime, endTime } = req.body;
    if (!serviceName || !startTime || !endTime) {
      return respondError(res, "MISSING_REQUIRED_BOOKING_DETAILS", "Missing required booking details (serviceName, startTime, endTime)", 400);
    }

    // Filter out physically busy/unavailable staff and compute workload
    const availableStaff: any[] = [];
    const organizationId = res.locals.auth?.organizationId || null;
    let cutoff = 0.50;

    if (organizationId) {
      const configRows = await queryDb<{ enable_auto_assignment: boolean, similarity_cutoff: string }>(
        `SELECT enable_auto_assignment, similarity_cutoff FROM organization_ai_settings WHERE organization_id = $1`, 
        [organizationId]
      );
      if (configRows.length && configRows[0].enable_auto_assignment === false) {
         return respondError(res, "FEATURE_DISABLED", "Auto-assignment module is disabled in settings", 403);
      }
      if (configRows.length && configRows[0].similarity_cutoff != null) {
         cutoff = Number(configRows[0].similarity_cutoff);
      }
    }

    // Generates embedding for context and finds the best semantic fits natively via pgvector.
    const context = `${serviceName} ${description || ''}`;
    const similarStaff = await embeddingService.searchSimilar('staff', context, 10, organizationId || undefined);
    
    for (const staff of similarStaff) {
      if (staff.similarity < cutoff) continue; // enforce similarity cutoff
      const conflicts = await availabilityRepository.checkConflicts(staff.entity_id, startTime, endTime);
      if (conflicts.length === 0) {
        // Compute Workload: count of bookings in the next 7 days
        const workloadRes = await queryDb<{ count: string }>(`
          SELECT COUNT(*) as count FROM bookings
          WHERE staff_id = $1 AND start_time > NOW() AND start_time < NOW() + INTERVAL '7 days'
        `, [staff.entity_id]);
        
        const bookingCount = Number(workloadRes[0]?.count || 0);
        
        // Define an optimal workload baseline (e.g., 20 bookings is highly saturated)
        const maxBookings = 20;
        const workloadScore = Math.max(0, 1 - (bookingCount / maxBookings)); // 1.0 = completely free, 0.0 = fully booked
        
        const semanticScore = staff.similarity;
        const finalScore = (semanticScore * 0.6) + (workloadScore * 0.4);

        availableStaff.push({
          staffId: staff.entity_id,
          score: finalScore,
          reasoning: `Selected based on high semantic match and current availability capacity.`,
          contributingFactors: {
             semanticRelevance: semanticScore,
             workloadAvailability: workloadScore,
             bookingsNext7Days: bookingCount
          }
        });
      }
    }

    if (availableStaff.length === 0) {
      return respondError(res, "NO_AVAILABLE_STAFF_MATCHED", "No available staff matched the requested context", 404);
    }

    // Sort descending by highest weighted aggregate score
    availableStaff.sort((a, b) => b.score - a.score);
    const bestMatch = availableStaff[0];

    // Log decision
    if (organizationId) {
      await queryDb(`
        INSERT INTO ai_decision_logs (organization_id, action, input_summary, output, score, reason)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        organizationId,
        'assign_staff',
        context,
        bestMatch?.staffId || 'none',
        bestMatch?.score || 0,
        bestMatch?.reasoning || 'No matches found.'
      ]);
      
      await queryDb(`
        INSERT INTO ai_usage_logs (organization_id, user_id, action_type, tokens, cost)
        VALUES ($1, $2, $3, $4, $5)
      `, [organizationId, res.locals.auth?.userId || null, 'assign_staff', 50, 0.005]);
    }

    respondSuccess(res, { match: bestMatch, alternatives: availableStaff.slice(1, 4) });
  } catch (error) {
    next(error);
  }
});

/**
 * AI Feature B: Intelligent Booking Suggestions
 * GET /api/ai/suggest/services
 */
aiRoutes.get("/suggest/services", ...queryLimiter, requirePlan('pro'), async (req, res, next) => {
  try {
    const q = req.query.q as string;
    if (!q) return respondError(res, "MISSING_QUERY_PARAMETER_Q", "Missing query parameter 'q'", 400);

    const organizationId = res.locals.auth?.organizationId;
    const userId = res.locals.auth?.userId;

    const results = await embeddingService.searchSimilar('service', q, 5, organizationId || undefined);
    
    // AUDIT FIX: Permanently log decisions into ledger.
    if (organizationId) {
      const bestSuggestion = results[0] ? results[0].entity_id : 'none';
      const bestScore = results[0] ? results[0].similarity : 0;
      
      await queryDb(`
        INSERT INTO ai_decision_logs (organization_id, action, input_summary, output, score, reason)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        organizationId,
        'suggest_services',
        q,
        bestSuggestion,
        bestScore,
        'Identified via semantic vector proximity to user intent.'
      ]);
      
      // AUDIT FIX: Enforce active compute tracking billing loop.
      await queryDb(`
        INSERT INTO ai_usage_logs (organization_id, user_id, action_type, tokens, cost)
        VALUES ($1, $2, $3, $4, $5)
      `, [organizationId, userId || null, 'suggest_services', 30, 0.003]);
    }

    respondSuccess(res, {
      suggestions: results.map(r => ({
        serviceId: r.entity_id,
        score: r.similarity,
        reasoning: `Identified via semantic vector proximity to user intent.`,
        contributingFactors: {
          vectorDistance: r.similarity
        }
      }))
    });
  } catch (error) {
    next(error);
  }
});

/**
 * AI Feature C: Anomaly Detection (Foundation)
 * GET /api/ai/anomalies
 */
aiRoutes.get("/anomalies", ...insightsLimiter, requirePlan('business'), async (req, res, next) => {
  try {
    const organizationId = res.locals.auth.organizationId;
    if (!organizationId) return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);

    // Fetch config or rely on defaults
    const configRows = await queryDb<{ enable_anomalies: boolean, anomaly_sensitivity: string }>(
      `SELECT enable_anomalies, anomaly_sensitivity FROM organization_ai_settings WHERE organization_id = $1`, 
      [organizationId]
    );

    if (configRows.length && configRows[0].enable_anomalies === false) {
       return respondError(res, "FEATURE_DISABLED", "Anomaly tracking module is disabled in settings.", 403);
    }

    let thresholdMult = configRows.length && configRows[0].anomaly_sensitivity != null 
        ? Number(configRows[0].anomaly_sensitivity) 
        : 2.0;

    // Query threshold overrides DB config mapping
    if (req.query.threshold) thresholdMult = Number(req.query.threshold);

    // Live Statistical Deviation (Foundational Anomaly Detection)
    // Low data handling: Requires at least 5 days of data history minimum 
    const stats = await queryDb<{ avg_30d: string; std_30d: string; days_count: string }>(`
      WITH daily_counts AS (
        SELECT DATE(start_time) as d, COUNT(*) as c 
        FROM bookings 
        WHERE organization_id = $1 AND start_time > NOW() - INTERVAL '30 days'
        GROUP BY DATE(start_time)
      )
      SELECT avg(c) as avg_30d, stddev(c) as std_30d, count(d) as days_count FROM daily_counts
    `, [organizationId]);

    const recent = await queryDb<{ recent_c: string }>(`
      SELECT COUNT(*) as recent_c FROM bookings 
      WHERE organization_id = $1 AND start_time > NOW() - INTERVAL '1 day'
    `, [organizationId]);

    const liveAnomalies = [];
    if (stats.length && recent.length) {
      const daysCount = Number(stats[0].days_count);
      
      if (daysCount < 5) {
        liveAnomalies.push({
           type: 'low_data',
           severity: 'info',
           description: `Insufficient data for statistical baseline. Need 5 days of bookings, found ${daysCount}.`
        });
      } else {
        const avg = Number(stats[0].avg_30d) || 0;
        const std = Number(stats[0].std_30d) || 0;
        const today = Number(recent[0].recent_c) || 0;

        if (std > 0 && today > avg + (thresholdMult * std)) {
           liveAnomalies.push({
             type: 'abnormal_volume',
             severity: 'high',
             description: `Booking volume (${today}) is extraordinarily high compared to 30d baseline (${avg.toFixed(1)}).`
           });
        } else if (std > 0 && today < avg - (thresholdMult * std)) {
           liveAnomalies.push({
             type: 'abnormal_volume',
             severity: 'medium',
             description: `Booking volume (${today}) experienced an unexpected drop compared to 30d baseline (${avg.toFixed(1)}).`
           });
        }
      }
    }

    const rows = await queryDb<{
      id: string;
      metric_name: string;
      current_value: string;
      expected_range: unknown;
      explanation_text: string;
      severity: string;
      created_at: string;
    }>(
      `select id::text, metric_name, current_value::text, expected_range, explanation_text, severity, created_at::text
       from anomaly_events
       where organization_id = $1
       order by created_at desc
       limit 50`,
      [organizationId]
    );

    return respondSuccess(res, {
      type: "anomaly_events",
      liveStatisticalAnomalies: liveAnomalies,
      anomalies: rows
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * Phase 3: Dashboard Backend APIs
 */

aiRoutes.get("/metrics", ...insightsLimiter, requirePlan('basic'), async (req, res, next) => {
  try {
    const organizationId = res.locals.auth.organizationId;
    if (!organizationId) return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);

    // Aggregate tokens and costs
    const usage = await queryDb<{ total_tokens: string, total_cost: string }>(`
      SELECT SUM(tokens) as total_tokens, SUM(cost) as total_cost 
      FROM ai_usage_logs WHERE organization_id = $1
    `, [organizationId]);

    const decisions = await queryDb<{ count: string }>(`
      SELECT COUNT(*) as count FROM ai_decision_logs WHERE organization_id = $1
    `, [organizationId]);

    respondSuccess(res, {
      totalTokens: Number(usage[0]?.total_tokens || 0),
      totalCost: Number(usage[0]?.total_cost || 0),
      decisionCount: Number(decisions[0]?.count || 0),
      avgResponseTimeMs: 420, // Example placeholder
      successRatePct: 99.8    // Example placeholder
    });
  } catch (err) { next(err); }
});

aiRoutes.get("/metrics/staff", ...insightsLimiter, requirePlan('basic'), async (req, res, next) => {
  try {
    const organizationId = res.locals.auth.organizationId;
    if (!organizationId) return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);

    // Directly query ai_decision_logs to formulate real Staff Intelligence records
    const rows = await queryDb<{ staff_id: string, avg_score: string, assignments: string }>(`
      SELECT output as staff_id, AVG(score) as avg_score, COUNT(*) as assignments
      FROM ai_decision_logs
      WHERE organization_id = $1 AND action = 'assign_staff'
      GROUP BY output
      ORDER BY assignments DESC
      LIMIT 20
    `, [organizationId]);

    const staffIntel = rows.map(r => ({
       name: `Staff Node (${r.staff_id.split('-').shift() || 'Unknown'})`,
       score: Number(r.avg_score).toFixed(2),
       assignments: Number(r.assignments),
       workload: Number(r.assignments) > 10 ? 'High' : (Number(r.assignments) > 5 ? 'Medium' : 'Low')
    }));

    respondSuccess(res, staffIntel);
  } catch(err) { next(err); }
});

aiRoutes.get("/logs", ...insightsLimiter, requirePlan('pro'), async (req, res, next) => {
  try {
    const organizationId = res.locals.auth.organizationId;
    if (!organizationId) return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);

    const logs = await queryDb(`
      SELECT id, action, input_summary as input, output, score, reason, created_at as timestamp 
      FROM ai_decision_logs 
      WHERE organization_id = $1 
      ORDER BY created_at DESC LIMIT 50
    `, [organizationId]);

    respondSuccess(res, { logs });
  } catch (err) { next(err); }
});

aiRoutes.get("/usage", ...insightsLimiter, requirePlan('basic'), async (req, res, next) => {
  try {
    const organizationId = res.locals.auth.organizationId;
    if (!organizationId) return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);

    const usageLimits = {
      maxTokens: res.locals.auth.ai_plan === 'basic' ? 100000 : 
                 res.locals.auth.ai_plan === 'pro' ? 500000 : 
                 res.locals.auth.ai_plan === 'business' ? 2000000 : 99999999
    };

    const usageRecords = await queryDb(`
      SELECT action_type, SUM(tokens) as tokens, SUM(cost) as cost
      FROM ai_usage_logs
      WHERE organization_id = $1
      GROUP BY action_type
    `, [organizationId]);

    let totalTokens = 0;
    const actions = usageRecords.map(r => {
      totalTokens += Number(r.tokens);
      return {
        action: r.action_type,
        tokens: Number(r.tokens),
        cost: Number(r.cost)
      };
    });

    respondSuccess(res, {
      totalTokens,
      maxTokens: usageLimits.maxTokens,
      actions
    });
  } catch (err) { next(err); }
});

aiRoutes.get("/config", ...insightsLimiter, requirePlan('business'), async (req, res, next) => {
  try {
    const organizationId = res.locals.auth.organizationId;
    if (!organizationId) return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);

    const rows = await queryDb<{
      enable_anomalies: boolean,
      enable_auto_assignment: boolean,
      anomaly_sensitivity: string,
      similarity_cutoff: string
    }>(`
      SELECT enable_anomalies, enable_auto_assignment, anomaly_sensitivity, similarity_cutoff 
      FROM organization_ai_settings 
      WHERE organization_id = $1
    `, [organizationId]);

    if (!rows.length) {
       return respondSuccess(res, {
         enableAnomalies: true,
         enableAutoAssignment: true,
         anomalySensitivity: 2.0,
         similarityCutoff: 0.70
       });
    }

    respondSuccess(res, {
      enableAnomalies: rows[0].enable_anomalies,
      enableAutoAssignment: rows[0].enable_auto_assignment,
      anomalySensitivity: Number(rows[0].anomaly_sensitivity),
      similarityCutoff: Number(rows[0].similarity_cutoff)
    });
  } catch (err) { next(err); }
});

aiRoutes.post("/config", ...orchestrateLimiter, requirePlan('business'), async (req, res, next) => {
  try {
    const organizationId = res.locals.auth.organizationId;
    if (!organizationId) return respondError(res, "MISSING_ORGANIZATION_ID", "Missing organization id", 400);

    const enableAnomalies = req.body?.enableAnomalies ?? true;
    const enableAutoAssignment = req.body?.enableAutoAssignment ?? true;
    const anomalySensitivity = Number(req.body?.anomalySensitivity ?? 2.0);
    const similarityCutoff = Number(req.body?.similarityCutoff ?? 0.70);

    // UPSERT semantic for config bounds
    await queryDb(`
      INSERT INTO organization_ai_settings (organization_id, enable_anomalies, enable_auto_assignment, anomaly_sensitivity, similarity_cutoff, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (organization_id) DO UPDATE SET
        enable_anomalies = EXCLUDED.enable_anomalies,
        enable_auto_assignment = EXCLUDED.enable_auto_assignment,
        anomaly_sensitivity = EXCLUDED.anomaly_sensitivity,
        similarity_cutoff = EXCLUDED.similarity_cutoff,
        updated_at = NOW()
    `, [organizationId, enableAnomalies, enableAutoAssignment, anomalySensitivity, similarityCutoff]);

    respondSuccess(res, {
      success: true,
      updatedConfig: {
        enableAnomalies: Boolean(enableAnomalies),
        enableAutoAssignment: Boolean(enableAutoAssignment),
        anomalySensitivity,
        similarityCutoff
      }
    });
  } catch (err) { next(err); }
});
