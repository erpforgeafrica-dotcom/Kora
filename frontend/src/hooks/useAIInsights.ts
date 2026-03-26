import { useState, useEffect } from "react";
import {
  orchestrateLive,
  type LiveOrchestrationResult,
  type ScoredAction
} from "../services/api";

/**
 * DEPRECATED: Use orchestrateLive() directly for new code.
 * This hook will be phased out in favor of direct orchestration API calls.
 */
export function useAIInsights(organizationId?: string) {
  const [insights, setInsights] = useState<ScoredAction[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [rankedCommands, setRankedCommands] = useState<ScoredAction[]>([]);
  const [predictions, setPredictions] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [orchestrationResult, setOrchestrationResult] = useState<LiveOrchestrationResult | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await orchestrateLive(5, false, organizationId);
      setOrchestrationResult(result);
      
      // Map orchestration result to legacy hook shape
      setInsights([...result.prioritizedActions.slice(0, 3)]);
      setSuggestions([result.nextActionRecommendation]);
      setRankedCommands([...result.prioritizedActions]);
      setPredictions({ policies: result.policyOutcomes });
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch insights");
    } finally {
      setLoading(false);
    }
  };

  const rankCommands = async (commands: Array<{ id: string; title: string; severity: string; context: string }>) => {
    try {
      const result = await orchestrateLive(Math.min(commands.length, 10), false, organizationId);
      setRankedCommands([...result.prioritizedActions]);
      return result.prioritizedActions;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rank commands");
      return [];
    }
  };

  useEffect(() => {
    const interval = setInterval(fetchInsights, 30000); // Refresh every 30s
    fetchInsights(); // Initial fetch

    return () => clearInterval(interval);
  }, [organizationId]);

  return {
    insights,
    suggestions,
    rankedCommands,
    predictions,
    loading,
    error,
    lastUpdated,
    fetchInsights,
    rankCommands,
    // NEW: Direct access to full orchestration result
    orchestrationResult
  };
}
