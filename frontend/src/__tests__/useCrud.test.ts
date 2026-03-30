import { act, renderHook, waitFor } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { useCrud } from '../hooks/useCrud';

const mockData = [
  { id: '1', name: 'John Doe', email: 'john@example.com' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
];

const server = setupServer(
  http.get('/api/csrf-token', () => {
    return HttpResponse.json({
      success: true,
      data: { csrfToken: 'csrf-test-token' },
      meta: null,
    });
  }),

  http.get('/api/clients', () => {
    return HttpResponse.json(mockData);
  }),
  
  http.post('/api/clients', async ({ request }) => {
    const newClient = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ id: '3', ...newClient });
  }),
  
  http.patch('/api/clients/:id', async ({ params, request }) => {
    const updates = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ id: params.id, ...updates });
  }),
  
  http.delete('/api/clients/:id', () => {
    return new HttpResponse(null, { status: 204 });
  })
);

describe('useCrud Hook', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('should fetch data on mount', async () => {
    const { result } = renderHook(() => useCrud('/api/clients'));
    
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual(mockData);
    });
  });

  it('should create new item', async () => {
    const { result } = renderHook(() => useCrud('/api/clients'));
    
    await waitFor(() => expect(result.current.loading).toBe(false));
    
    const newClient = { name: 'Bob Wilson', email: 'bob@example.com' };
    await act(async () => {
      await result.current.create(newClient as any);
    });
    
    // Should refetch data after create
    expect(result.current.data).toEqual(mockData);
  });

  it('should update existing item', async () => {
    const { result } = renderHook(() => useCrud('/api/clients'));
    
    await waitFor(() => expect(result.current.loading).toBe(false));
    
    await act(async () => {
      await result.current.update('1', { name: 'John Updated' } as any);
    });
    
    // Should refetch data after update
    expect(result.current.data).toEqual(mockData);
  });

  it('should delete item', async () => {
    const { result } = renderHook(() => useCrud('/api/clients'));
    
    await waitFor(() => expect(result.current.loading).toBe(false));
    
    await act(async () => {
      await result.current.deleteItem('1');
    });
    
    // Should refetch data after delete
    expect(result.current.data).toEqual(mockData);
  });

  it('should handle API errors', async () => {
    server.use(
      http.get('/api/clients', () => {
        return new HttpResponse('Server Error', { status: 500 });
      })
    );
    
    const { result } = renderHook(() => useCrud('/api/clients'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBe(null);
    });
  });
});
