import { useState, useCallback } from 'react';

export interface AIMetrics {
  totalTokens: number;
  totalCost: number;
  decisionCount: number;
  avgResponseTimeMs: number;
  successRatePct: number;
}

export interface AILog {
  action: string;
  input_summary: string;
  output: string;
  score: number;
  reason: string;
  timestamp: string;
}

export interface AIUsage {
  totalTokens: number;
  maxTokens: number;
  actions: { action: string; tokens: number; cost: number }[];
}

export interface AIStaffMetric {
  name: string;
  score: number;
  assignments: number;
  workload: string;
}

export interface AIConfig {
    enableAnomalies: boolean;
    enableAutoAssignment: boolean;
    anomalySensitivity: number;
    similarityCutoff: number;
}

export interface AIAnomalyEvent {
    type?: string;
    severity: string;
    description?: string;
    timestamp?: string;
    metric_name?: string;
    current_value?: string;
    created_at?: string;
}

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
    try {
      setLoading(true);
      setError(null);
      const url = `/api/ai${endpoint}`;
      const res = await fetch(url, options);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'API Request Failed');
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getMetrics = useCallback(() => request<AIMetrics>('/metrics'), []);
  const getLogs = useCallback(() => request<{logs: AILog[]}>('/logs'), []);
  const getUsage = useCallback(() => request<AIUsage>('/usage'), []);
  const getStaffMetrics = useCallback(() => request<AIStaffMetric[]>('/metrics/staff'), []);
  const getConfig = useCallback(() => request<AIConfig>('/config'), []);
  const getAnomalies = useCallback(() => request<{ liveStatisticalAnomalies: AIAnomalyEvent[], anomalies: AIAnomalyEvent[] }>('/anomalies'), []);
  
  const updateConfig = useCallback((config: Partial<AIConfig>) => {
    return request<{success: boolean, updatedConfig: AIConfig}>('/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
    });
  }, []);

  const resolveAnomaly = useCallback((id: string) => {
    // Simulated endpoint action for resolving anomaly
    return Promise.resolve({ success: true, id });
  }, []);

  return {
    loading,
    error,
    getMetrics,
    getLogs,
    getUsage,
    getStaffMetrics,
    getConfig,
    getAnomalies,
    updateConfig,
    resolveAnomaly
  };
}
