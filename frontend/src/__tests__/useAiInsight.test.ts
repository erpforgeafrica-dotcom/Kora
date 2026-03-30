import { act, renderHook, waitFor } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { useAiInsight, __resetAiInsightCache } from '../hooks/useAiInsight';

const mockAiPrediction = {
  type: 'demand_forecast',
  prediction: 'Peak demand expected tomorrow 2-4pm',
  confidence: 0.92,
  timestamp: new Date().toISOString(),
  recommendations: [
    'Schedule additional staff for 2-4pm slot',
    'Prepare high-demand services inventory'
  ]
};

const mockAiAnomalies = {
  type: 'anomaly_detection',
  anomalies: [
    {
      id: 'anom_1',
      severity: 'high',
      message: 'Unusual spike in cancellations',
      affected_service: 'Wellness Massage',
      timestamp: new Date().toISOString()
    }
  ]
};

const mockAiCrmScores = {
  type: 'crm_scoring',
  at_risk_clients: [
    {
      client_id: '1',
      name: 'John Doe',
      risk_score: 0.85,
      reason: 'No bookings in 30 days',
      recommended_action: 'Send re-engagement email'
    }
  ]
};

const server = setupServer(
  http.get('/api/ai/forecast', () => {
    return HttpResponse.json(mockAiPrediction);
  }),
  
  http.get('/api/ai/anomalies', () => {
    return HttpResponse.json(mockAiAnomalies);
  }),
  
  http.get('/api/ai/crm-scores', () => {
    return HttpResponse.json(mockAiCrmScores);
  })
);

describe('useAiInsight Hook', () => {
  beforeAll(() => server.listen());
  beforeEach(() => { __resetAiInsightCache(); vi.useRealTimers(); });
  afterEach(() => { server.resetHandlers(); vi.useRealTimers(); });
  afterAll(() => server.close());

  it('should fetch AI forecast prediction', async () => {
    const { result } = renderHook(() => useAiInsight('forecast'));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);

    await waitFor(() => {
      const data = result.current.data as typeof mockAiPrediction;
      expect(result.current.loading).toBe(false);
      expect(data).toEqual(mockAiPrediction);
      expect(data.prediction).toContain('Peak demand');
    });
  });

  it('should fetch AI anomalies', async () => {
    const { result } = renderHook(() => useAiInsight('anomalies'));

    await waitFor(() => {
      const data = result.current.data as typeof mockAiAnomalies;
      expect(result.current.loading).toBe(false);
      expect(data).toEqual(mockAiAnomalies);
      expect(data.anomalies).toHaveLength(1);
      expect(data.anomalies[0].severity).toBe('high');
    });
  });

  it('should fetch CRM risk scores', async () => {
    const { result } = renderHook(() => useAiInsight('crm-scores'));

    await waitFor(() => {
      const data = result.current.data as typeof mockAiCrmScores;
      expect(result.current.loading).toBe(false);
      expect(data).toEqual(mockAiCrmScores);
      expect(data.at_risk_clients).toHaveLength(1);
      expect(data.at_risk_clients[0].risk_score).toBe(0.85);
    });
  });

  it('should handle loading state', () => {
    const { result } = renderHook(() => useAiInsight('forecast'));

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('should handle error state', async () => {
    server.use(
      http.get('/api/ai/forecast', () => {
        return new HttpResponse('AI Service Unavailable', { status: 503 });
      })
    );

    const { result } = renderHook(() => useAiInsight('forecast'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBe(null);
    });
  });

  it('should auto-refresh predictions every 30 seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { result, unmount } = renderHook(() => useAiInsight('forecast', { refreshInterval: 30000 }));

    try {
      await waitFor(() => {
        expect(result.current.data).toEqual(mockAiPrediction);
      }, { timeout: 3000 });

      await act(async () => {
        vi.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockAiPrediction);
      }, { timeout: 3000 });
    } finally {
      unmount();
      vi.useRealTimers();
    }
  });

  it('should handle null/empty predictions gracefully', async () => {
    server.use(
      http.get('/api/ai/forecast', () => {
        return HttpResponse.json({ type: 'forecast', prediction: null });
      })
    );

    const { result } = renderHook(() => useAiInsight('forecast'));

    await waitFor(() => {
      const data = result.current.data as { type: string; prediction: null };
      expect(result.current.loading).toBe(false);
      expect(data.prediction).toBe(null);
      expect(result.current.error).toBe(null);
    });
  });

  it('should cache predictions to avoid excessive API calls', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    
    const { result: result1 } = renderHook(() => useAiInsight('forecast'));
    await waitFor(() => expect(result1.current.loading).toBe(false));

    const { result: result2 } = renderHook(() => useAiInsight('forecast'));
    await waitFor(() => expect(result2.current.loading).toBe(false));

    // Should only fetch once due to caching
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    fetchSpy.mockRestore();
  });

  it('should return confidence score for predictions', async () => {
    const { result } = renderHook(() => useAiInsight('forecast'));

    await waitFor(() => {
      const data = result.current.data as typeof mockAiPrediction;
      expect(data.confidence).toBe(0.92);
      expect(data.confidence).toBeGreaterThan(0);
      expect(data.confidence).toBeLessThanOrEqual(1);
    });
  });

  it('should include recommendations in response', async () => {
    const { result } = renderHook(() => useAiInsight('forecast'));

    await waitFor(() => {
      const data = result.current.data as typeof mockAiPrediction;
      expect(data.recommendations).toBeDefined();
      expect(Array.isArray(data.recommendations)).toBe(true);
      expect(data.recommendations.length).toBeGreaterThan(0);
    });
  });
});
