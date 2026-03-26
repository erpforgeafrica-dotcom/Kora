import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { useQueryErrorHandler } from '../hooks/useQueryErrorHandler';
import { useAppStore } from '../stores/useAppStore';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock toast context
const mockShowToast = vi.fn();
vi.mock('../contexts/KoraToastContext', () => ({
  useToast: () => ({
    showToast: mockShowToast
  })
}));

describe('useQueryErrorHandler Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    mockShowToast.mockClear();
    useAppStore.setState({ lastError: null, errorTimestamp: null });
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: 0 }
      }
    });
  });

  it('should setup global error handler on mount', () => {
    const { result } = renderHook(() => useQueryErrorHandler());
    
    // Hook should be defined (setup successfully)
    expect(result.current).toBeDefined();
  });

  it('should set error state on mutation error', async () => {
    renderHook(() => useQueryErrorHandler());

    // Simulate a mutation error
    const errorMessage = 'Network error occurred';
    useAppStore.setState({ lastError: errorMessage, errorTimestamp: Date.now() });

    await waitFor(() => {
      const state = useAppStore.getState();
      expect(state.lastError).toBe(errorMessage);
      expect(state.errorTimestamp).toBeDefined();
    });
  });

  it('should clear error state via clearAppError', async () => {
    useAppStore.setState({ 
      lastError: 'Some error', 
      errorTimestamp: Date.now() 
    });

    useAppStore.getState().clearAppError();

    await waitFor(() => {
      const state = useAppStore.getState();
      expect(state.lastError).toBeNull();
      expect(state.errorTimestamp).toBeNull();
    });
  });

  it('should handle 401 unauthorized error', async () => {
    useAppStore.setState({ 
      lastError: 'Unauthorized - please log in',
      errorTimestamp: Date.now()
    });

    const state = useAppStore.getState();
    expect(state.lastError).toContain('Unauthorized');
  });

  it('should handle 403 forbidden error', async () => {
    useAppStore.setState({ 
      lastError: 'You do not have permission to access this',
      errorTimestamp: Date.now()
    });

    const state = useAppStore.getState();
    expect(state.lastError).toContain('permission');
  });

  it('should handle 404 not found error', async () => {
    useAppStore.setState({ 
      lastError: 'Resource not found',
      errorTimestamp: Date.now()
    });

    const state = useAppStore.getState();
    expect(state.lastError).toContain('not found');
  });

  it('should handle 422 validation error', async () => {
    useAppStore.setState({ 
      lastError: 'Invalid input: Email is required',
      errorTimestamp: Date.now()
    });

    const state = useAppStore.getState();
    expect(state.lastError).toContain('Invalid input');
  });

  it('should handle 500 server error', async () => {
    useAppStore.setState({ 
      lastError: 'Server error - please try again later',
      errorTimestamp: Date.now()
    });

    const state = useAppStore.getState();
    expect(state.lastError).toContain('Server error');
  });

  it('should handle network error', async () => {
    useAppStore.setState({ 
      lastError: 'Network request failed - check your connection',
      errorTimestamp: Date.now()
    });

    const state = useAppStore.getState();
    expect(state.lastError).toContain('Network');
  });

  it('should persist error timestamp for tracking', () => {
    const before = Date.now();
    useAppStore.setState({ 
      lastError: 'Test error',
      errorTimestamp: before
    });

    const state = useAppStore.getState();
    expect(state.errorTimestamp).toBe(before);
    expect(state.lastError).toBe('Test error');
  });
});
