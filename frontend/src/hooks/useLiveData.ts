import { useEffect, useState } from "react";

interface UseLiveDataOptions<T> {
  fetcher: () => Promise<T>;
  refreshInterval?: number;
  initialData?: T;
}

export function useLiveData<T>({ fetcher, refreshInterval = 30000, initialData }: UseLiveDataOptions<T>) {
  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const result = await fetcher();
        if (mounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    const interval = setInterval(fetchData, refreshInterval);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [fetcher, refreshInterval]);

  return { data, loading, error };
}
