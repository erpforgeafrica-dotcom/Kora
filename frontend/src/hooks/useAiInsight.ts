import { useCallback, useEffect, useMemo, useState } from "react";

type InsightType = "forecast" | "anomalies" | "crm-scores";
type Options = { refreshInterval?: number };

type CacheEntry = unknown;

const endpointByType: Record<InsightType, string> = {
  forecast: "/api/ai/forecast",
  anomalies: "/api/ai/anomalies",
  "crm-scores": "/api/ai/crm-scores",
};

// Module-level cache to avoid duplicate fetches across hook instances.
const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, { epoch: number; promise: Promise<CacheEntry> }>();
let cacheEpoch = 0;

// Test helper to keep unit tests isolated from each other.
export function __resetAiInsightCache() {
  cacheEpoch += 1;
  cache.clear();
  inflight.clear();
}

async function fetchJson(url: string): Promise<CacheEntry> {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed with status code ${res.status}`);
  }
  return res.json();
}

export function useAiInsight(type: InsightType, options: Options = {}) {
  const url = useMemo(() => endpointByType[type], [type]);
  const cached = cache.get(url) ?? null;

  const [data, setData] = useState<CacheEntry | null>(cached);
  const [loading, setLoading] = useState<boolean>(cached === null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (force = false) => {
      const epochAtStart = cacheEpoch;
      setError(null);

      if (!force && cache.has(url)) {
        setData(cache.get(url) ?? null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const existing = inflight.get(url);
        let p = existing?.promise;
        if (!p) {
          const entry: { epoch: number; promise: Promise<CacheEntry> } = {
            epoch: epochAtStart,
            promise: Promise.resolve()
          };
          entry.promise = fetchJson(url).finally(() => {
            const current = inflight.get(url);
            if (current && current.promise === entry.promise && current.epoch === entry.epoch) {
              inflight.delete(url);
            }
          });
          inflight.set(url, entry);
          p = entry.promise;
        }
        const json = await p;
        if (epochAtStart === cacheEpoch) {
          cache.set(url, json);
          setData(json);
        }
      } catch (e) {
        setData(null);
        setError(e instanceof Error ? e.message : "Failed to load AI insight");
      } finally {
        setLoading(false);
      }
    },
    [url]
  );

  useEffect(() => {
    // If cached, don't trigger another network request on mount.
    void load(false);
  }, [load]);

  useEffect(() => {
    if (!options.refreshInterval) return;
    const id = setInterval(() => void load(true), options.refreshInterval);
    return () => clearInterval(id);
  }, [load, options.refreshInterval]);

  return { data, loading, error, refetch: () => load(true) };
}
