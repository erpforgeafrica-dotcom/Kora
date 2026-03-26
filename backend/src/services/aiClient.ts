import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import { Mistral } from "@mistralai/mistralai";
import OpenAI from "openai";
import { queryDb } from "../db/client.js";
import { logger } from "../shared/logger.js";

export type AIProvider = "anthropic" | "openai" | "google" | "mistral";

export type AITaskType =
  | "orchestration_ranking"
  | "anomaly_explanation"
  | "revenue_forecasting"
  | "compliance_advisory"
  | "fast_classification"
  | "embedding_generation"
  | "multimodal_report"
  | "fallback";

export type AIModel =
  | "claude-3-5-haiku"
  | "claude-sonnet-4"
  | "gpt-4o-mini"
  | "gpt-4o"
  | "mistral-small"
  | "gemini-1.5-flash";

export interface ProviderConfig {
  provider: AIProvider;
  model: AIModel;
}

export interface ModelRouter {
  route(task: AITaskType): ProviderConfig;
  fallback(task: AITaskType): ProviderConfig[];
}

const MODEL_PROVIDER: Record<AIModel, AIProvider> = {
  "claude-3-5-haiku": "anthropic",
  "claude-sonnet-4": "anthropic",
  "gpt-4o-mini": "openai",
  "gpt-4o": "openai",
  "mistral-small": "mistral",
  "gemini-1.5-flash": "google"
};

const MODEL_ID: Record<AIModel, string> = {
  "claude-3-5-haiku": "claude-3-5-haiku-20241022",
  "claude-sonnet-4": "claude-3-5-sonnet-20240620",
  "gpt-4o-mini": "gpt-4o-mini",
  "gpt-4o": "gpt-4o",
  "mistral-small": "mistral-small-latest",
  "gemini-1.5-flash": "gemini-1.5-flash"
};

// Cost per 1M tokens (requested constants)
const COST_PER_MILLION: Record<AIModel, { input: number; output: number }> = {
  "claude-3-5-haiku": { input: 0.8, output: 4.0 },
  "claude-sonnet-4": { input: 3.0, output: 15.0 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4o": { input: 2.5, output: 10.0 },
  "mistral-small": { input: 0.1, output: 0.3 },
  "gemini-1.5-flash": { input: 0.075, output: 0.3 }
};

class DefaultModelRouter implements ModelRouter {
  route(task: AITaskType): ProviderConfig {
    switch (task) {
      case "orchestration_ranking":
      case "anomaly_explanation":
      case "compliance_advisory":
        return { provider: "anthropic", model: "claude-sonnet-4" };
      case "revenue_forecasting":
      case "embedding_generation":
        return { provider: "openai", model: "gpt-4o" };
      case "fast_classification":
        return { provider: "mistral", model: "mistral-small" };
      case "multimodal_report":
        return { provider: "google", model: "gemini-1.5-flash" };
      case "fallback":
      default:
        return { provider: "anthropic", model: "claude-3-5-haiku" };
    }
  }

  fallback(task: AITaskType): ProviderConfig[] {
    const primary = this.route(task);
    const chain: ProviderConfig[] = [
      primary,
      { provider: "anthropic", model: "claude-3-5-haiku" },
      { provider: "openai", model: "gpt-4o-mini" },
      { provider: "google", model: "gemini-1.5-flash" },
      { provider: "mistral", model: "mistral-small" }
    ];
    const seen = new Set<string>();
    return chain.filter((c) => {
      const key = `${c.provider}:${c.model}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

export interface TokenMetrics {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

export interface AIInferenceRequest {
  organizationId: string;
  userId: string | null;
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  taskType: AITaskType;
  metadata?: Record<string, unknown>;
}

export interface AIInferenceResult {
  content: string;
  tokens: TokenMetrics;
  latencyMs: number;
  modelUsed: AIModel;
  provider: AIProvider;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.length / 4));
}

export class AIClient {
  private anthropic?: Anthropic;
  private openai?: OpenAI;
  private google?: GoogleGenAI;
  private mistral?: Mistral;
  private router: ModelRouter;
  private lastSuccessful: ProviderConfig | null = null;

  constructor(private readonly organizationId: string, router: ModelRouter = new DefaultModelRouter()) {
    this.router = router;
    if (process.env.ANTHROPIC_API_KEY) this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    if (process.env.OPENAI_API_KEY) this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    if (process.env.GOOGLE_API_KEY) this.google = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
    if (process.env.MISTRAL_API_KEY) this.mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
  }

  private calculateCost(model: AIModel, inputTokens: number, outputTokens: number) {
    const c = COST_PER_MILLION[model];
    return (inputTokens / 1_000_000) * c.input + (outputTokens / 1_000_000) * c.output;
  }

  private async checkBudget() {
    const rows = await queryDb<{ monthly_limit_usd: string; current_month_spend_usd: string }>(
      `select monthly_limit_usd::text, current_month_spend_usd::text
       from ai_budgets where organization_id = $1`,
      [this.organizationId]
    );
    const row = rows[0];
    if (!row) return;
    const limit = Number(row.monthly_limit_usd);
    const spent = Number(row.current_month_spend_usd);
    if (spent >= limit) throw new Error(`Monthly AI budget exceeded for ${this.organizationId}`);
  }

  private async logUsage(req: AIInferenceRequest, res: AIInferenceResult) {
    await queryDb(
      `insert into ai_requests (
         id, organization_id, user_id, model, provider, prompt_tokens, completion_tokens, total_tokens, cost_usd, latency_ms, inference_type, metadata
       ) values (
         gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb
       )`,
      [
        req.organizationId,
        req.userId,
        res.modelUsed,
        res.provider,
        res.tokens.inputTokens,
        res.tokens.outputTokens,
        res.tokens.totalTokens,
        res.tokens.estimatedCost,
        res.latencyMs,
        req.taskType,
        JSON.stringify(req.metadata ?? {})
      ]
    );

    await queryDb(
      `insert into ai_budgets (id, organization_id, monthly_limit_usd, current_month_spend_usd, reset_date)
       values (gen_random_uuid(), $1, $2, $3, date_trunc('month', now()) + interval '1 month')
       on conflict (organization_id)
       do update set current_month_spend_usd = ai_budgets.current_month_spend_usd + excluded.current_month_spend_usd,
                     updated_at = now()`,
      [req.organizationId, Number(process.env.AI_BUDGET_USD_MONTHLY ?? 100), res.tokens.estimatedCost]
    );
  }

  private async invokeWithModel(model: AIModel, request: AIInferenceRequest): Promise<AIInferenceResult> {
    const provider = MODEL_PROVIDER[model];
    const modelId = MODEL_ID[model];
    const start = Date.now();
    let content = "";
    let inputTokens = estimateTokens(request.prompt);
    let outputTokens = 0;

    if (provider === "anthropic") {
      if (!this.anthropic) throw new Error("Anthropic key missing");
      const r = await this.anthropic.messages.create({
        model: modelId,
        max_tokens: request.maxTokens ?? 700,
        system: request.systemPrompt ?? "You are KORA intelligence engine.",
        messages: [{ role: "user", content: request.prompt }],
        temperature: request.temperature ?? 0.2
      });
      content = r.content[0]?.type === "text" ? r.content[0].text : "";
      inputTokens = r.usage.input_tokens;
      outputTokens = r.usage.output_tokens;
    } else if (provider === "openai") {
      if (!this.openai) throw new Error("OpenAI key missing");
      const r = await this.openai.responses.create({
        model: modelId,
        input: `${request.systemPrompt ?? ""}\n${request.prompt}`,
        max_output_tokens: request.maxTokens ?? 700,
        temperature: request.temperature ?? 0.2
      });
      content = r.output_text ?? "";
      inputTokens = r.usage?.input_tokens ?? inputTokens;
      outputTokens = r.usage?.output_tokens ?? estimateTokens(content);
    } else if (provider === "google") {
      if (!this.google) throw new Error("Google key missing");
      const r = await this.google.models.generateContent({
        model: modelId,
        contents: `${request.systemPrompt ?? ""}\n${request.prompt}`
      });
      content = r.text ?? "";
      outputTokens = estimateTokens(content);
    } else {
      if (!this.mistral) throw new Error("Mistral key missing");
      const r = await this.mistral.chat.complete({
        model: modelId,
        messages: [
          { role: "system", content: request.systemPrompt ?? "You are KORA intelligence engine." },
          { role: "user", content: request.prompt }
        ],
        maxTokens: request.maxTokens ?? 700,
        temperature: request.temperature ?? 0.2
      });
      content = String(r.choices?.[0]?.message?.content ?? "");
      inputTokens = r.usage?.promptTokens ?? inputTokens;
      outputTokens = r.usage?.completionTokens ?? estimateTokens(content);
    }

    const latencyMs = Date.now() - start;
    return {
      content,
      latencyMs,
      modelUsed: model,
      provider,
      tokens: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        estimatedCost: this.calculateCost(model, inputTokens, outputTokens)
      }
    };
  }

  async executeTask(request: AIInferenceRequest): Promise<AIInferenceResult> {
    await this.checkBudget();
    const chain = this.router.fallback(request.taskType);
    if (request.taskType === "fallback" && this.lastSuccessful) {
      chain.unshift(this.lastSuccessful);
    }

    const errors: string[] = [];
    for (const cfg of chain) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const result = await this.invokeWithModel(cfg.model, request);
          this.lastSuccessful = cfg;
          await this.logUsage(request, result);
          return result;
        } catch (e) {
          errors.push(`${cfg.provider}:${cfg.model}:attempt${attempt + 1}:${e instanceof Error ? e.message : String(e)}`);
          if (attempt < 2) await sleep(200 * 2 ** attempt);
        }
      }
    }
    throw new Error(`All providers failed for task ${request.taskType}: ${errors.join(" | ")}`);
  }

  async rankCommands(
    commands: Array<{ id: string; title: string; severity: string; context: string }>,
    userRole: string
  ): Promise<Array<{ rank: number; commandId: string; reasoning: string }>> {
    const prompt = `Rank by operational impact for role=${userRole}. Return JSON array [{rank,commandId,reasoning}] only.\n${JSON.stringify(
      commands
    )}`;
    const result = await this.executeTask({
      organizationId: this.organizationId,
      userId: "system",
      taskType: "orchestration_ranking",
      prompt,
      maxTokens: 500
    });
    try {
      return JSON.parse(result.content);
    } catch {
      return commands.map((c, idx) => ({ rank: idx + 1, commandId: c.id, reasoning: "Fallback ranking" }));
    }
  }

  async analyzeAnomaly(metric: string, baselineValue: number, currentValue: number, context: Record<string, unknown>) {
    const prompt = `Explain anomaly in two sentences. metric=${metric} baseline=${baselineValue} current=${currentValue} context=${JSON.stringify(
      context
    )}. Return JSON: {severity,rootCause,recommendation}`;
    const result = await this.executeTask({
      organizationId: this.organizationId,
      userId: "system",
      taskType: "anomaly_explanation",
      prompt,
      maxTokens: 220
    });
    try {
      return JSON.parse(result.content) as { severity: "critical" | "high" | "medium" | "low"; rootCause: string; recommendation: string };
    } catch {
      return {
        severity: Math.abs(currentValue - baselineValue) > baselineValue * 0.3 ? "high" : "medium",
        rootCause: "Signal deviation above expected pattern.",
        recommendation: "Trigger incident review and monitor related modules."
      };
    }
  }

  async generateCrossModuleInsights(moduleData: Record<string, unknown>) {
    const result = await this.executeTask({
      organizationId: this.organizationId,
      userId: "system",
      taskType: "multimodal_report",
      prompt: `Generate top 3 cross-module insights as JSON array [{title,impact,action}] from ${JSON.stringify(moduleData)}`,
      maxTokens: 500
    });
    try {
      return JSON.parse(result.content) as Array<{ title: string; impact: string; action: string }>;
    } catch {
      return [{ title: "Insight parsing fallback", impact: "medium", action: "Retry insight generation." }];
    }
  }

  async explainPolicySimulation(payload: Record<string, unknown>) {
    const result = await this.executeTask({
      organizationId: this.organizationId,
      userId: "system",
      taskType: "compliance_advisory",
      prompt: `Given this policy simulation context, return JSON {predicted_outcome,risk_if_not_executed,confidence}: ${JSON.stringify(payload)}`,
      maxTokens: 220
    });
    try {
      return JSON.parse(result.content) as { predicted_outcome: string; risk_if_not_executed: string; confidence: number };
    } catch {
      return {
        predicted_outcome: "Likely reduced operational risk if executed.",
        risk_if_not_executed: "Escalation risk increases within 24h.",
        confidence: 0.64
      };
    }
  }
}

export class AIClientFactory {
  static async createClient(organizationId: string) {
    return new AIClient(organizationId);
  }
}
