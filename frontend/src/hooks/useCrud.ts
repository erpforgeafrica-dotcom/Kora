// src/hooks/useCrud.ts
// Generic CRUD hook using axios + Zustand-like state management
import { useState, useEffect, useCallback } from "react";
import api from "../services/api";

export interface CrudState<T> {
  data: T[] | null;
  loading: boolean;
  error: string | null;
}

export interface CrudActions<T> {
  fetchAll: () => Promise<void>;
  create: (payload: Omit<T, "id">) => Promise<T>;
  update: (id: string, payload: Partial<T>) => Promise<T>;
  deleteItem: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
}

/**
 * Generic CRUD hook for any entity
 * @param baseUrl - API endpoint (e.g., "/api/clients")
 * @returns State and actions for CRUD operations
 */
export function useCrud<T extends { id: string }>(basePath: string): CrudState<T> & CrudActions<T> {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const unwrapEntity = useCallback((payload: any): any => {
    if (!payload || typeof payload !== "object") return payload;
    return (
      payload.client ||
      payload.booking ||
      payload.tenant ||
      payload.service ||
      payload.staff_member ||
      payload.staff ||
      payload.subscription ||
      payload.transaction ||
      payload.payment ||
      payload.item ||
      payload.data ||
      payload
    );
  }, []);

  // Fetch all entities
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(basePath);
      // Backend returns wrapped responses: { clients: [...], bookings: [...], etc }
      const responseData = response.data;
      const dataArray =
        responseData.clients ||
        responseData.bookings ||
        responseData.services ||
        responseData.staff ||
        responseData.transactions ||
        responseData.tenants ||
        responseData.subscriptions ||
        responseData.locations ||
        responseData.reviews ||
        responseData.media ||
        responseData.messages ||
        responseData.items ||
        responseData.data ||
        (Array.isArray(responseData) ? responseData : []);
      setData(dataArray);
    } catch (err: any) {
      const message = 
        err.response?.data?.error || 
        err.response?.data?.message ||
        err.message || 
        "Failed to load data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [basePath]);

  // Create a new entity
  const create = useCallback(
    async (payload: Omit<T, "id">): Promise<T> => {
      setLoading(true);
      try {
        const response = await api.post<T>(basePath, payload);
        const newItem = unwrapEntity(response.data) as T;

        // Keep local state in sync with server (also handles wrapped update responses).
        await fetchAll();
        setError(null);
        
        return newItem;
      } catch (err: any) {
        const message = err.response?.data?.error || err.message || "Failed to create";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [basePath, fetchAll, unwrapEntity]
  );

  // Update an entity
  const update = useCallback(
    async (id: string, payload: Partial<T>): Promise<T> => {
      setLoading(true);
      try {
        const response = await api.patch<T>(`${basePath}/${id}`, payload);
        const updated = unwrapEntity(response.data) as T;

        await fetchAll();
        setError(null);
        
        return updated;
      } catch (err: any) {
        const message = err.response?.data?.error || err.message || "Failed to update";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [basePath, fetchAll, unwrapEntity]
  );

  // Delete an entity
  const deleteItem = useCallback(
    async (id: string): Promise<void> => {
      setLoading(true);
      try {
        await api.delete(`${basePath}/${id}`);
        await fetchAll();
        setError(null);
      } catch (err: any) {
        const message = err.response?.data?.error || err.message || "Failed to delete";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [basePath, fetchAll]
  );

  // Clear error manually
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-fetch on mount or basePath change
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    // State
    data,
    loading,
    error,
    // Actions
    fetchAll,
    create,
    update,
    deleteItem,
    refetch: fetchAll,
    setError,
    clearError,
  };
}
