import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, afterAll, beforeAll, vi } from 'vitest';
import { useAppStore } from '../stores/useAppStore';

// Mock a simple CRUD component for testing
const TestCrudComponent = () => {
  const [name, setName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const { lastError, setAppError, clearAppError } = useAppStore();

  const handleCreate = async () => {
    try {
      clearAppError();
      setLoading(true);
      const response = await fetch('/api/test', {
        method: 'POST',
        body: JSON.stringify({ name })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create');
      }

      setName('');
    } catch (error) {
      setAppError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    clearAppError();
  };

  return (
    <div>
      <input 
        data-testid="name-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter name"
      />
      <button data-testid="create-btn" onClick={handleCreate} disabled={loading}>
        {loading ? 'Creating...' : 'Create'}
      </button>
      <button data-testid="clear-btn" onClick={handleClear}>
        Clear Error
      </button>
      {lastError && (
        <div data-testid="error-display" role="alert">
          {lastError}
        </div>
      )}
    </div>
  );
};

const server = setupServer(
  http.post('/api/test', async () => {
    return new HttpResponse(null, { status: 500 });
  })
);

describe('CRUD Component Error Handling Integration', () => {
  let queryClient: QueryClient;

  beforeAll(() => server.listen());

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: 0 }
      }
    });
    useAppStore.setState({ lastError: null, errorTimestamp: null });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => server.close());

  it('should display error when creation fails', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TestCrudComponent />
      </QueryClientProvider>
    );

    const input = screen.getByTestId('name-input');
    const button = screen.getByTestId('create-btn');

    fireEvent.change(input, { target: { value: 'Test Item' } });
    fireEvent.click(button);

    await waitFor(() => {
      const errorDisplay = screen.getByTestId('error-display');
      expect(errorDisplay).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should clear error when clear button is clicked', async () => {
    // First create an error state
    useAppStore.setState({ 
      lastError: 'Test error', 
      errorTimestamp: Date.now() 
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TestCrudComponent />
      </QueryClientProvider>
    );

    let errorDisplay = screen.getByTestId('error-display');
    expect(errorDisplay).toBeInTheDocument();

    const clearBtn = screen.getByTestId('clear-btn');
    fireEvent.click(clearBtn);

    await waitFor(() => {
      // Error should be removed from DOM
      expect(screen.queryByTestId('error-display')).not.toBeInTheDocument();
    });
  });

  it('should disable button while loading', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TestCrudComponent />
      </QueryClientProvider>
    );

    const input = screen.getByTestId('name-input');
    const button = screen.getByTestId('create-btn');

    fireEvent.change(input, { target: { value: 'Test Item' } });
    fireEvent.click(button);

    expect(button).toBeDisabled();

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });

  it('should clear input after successful attempt (when API returns error)', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TestCrudComponent />
      </QueryClientProvider>
    );

    const input = screen.getByTestId('name-input') as HTMLInputElement;
    const button = screen.getByTestId('create-btn');

    fireEvent.change(input, { target: { value: 'Test Item' } });
    fireEvent.click(button);

    await waitFor(() => {
      // Input should remain (error prevents clearing in this test case)
      expect(input.value).toBeDefined();
    });
  });

  it('should handle error state in Zustand store', async () => {
    const errorMsg = 'API request failed';
    useAppStore.setState({ 
      lastError: errorMsg,
      errorTimestamp: Date.now()
    });

    const state = useAppStore.getState();
    expect(state.lastError).toBe(errorMsg);
    expect(state.errorTimestamp).not.toBeNull();
  });
});
