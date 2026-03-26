import axios from "axios";
import type { AxiosError } from "axios";

/**
 * Error response shape from backend API
 */
export interface APIErrorResponse {
  error?: string;
  message?: string;
  details?: string;
  status?: number;
  timestamp?: string;
}

/**
 * Extract user-friendly error message from various error types
 */
export function extractErrorMessage(error: unknown): string {
  // Axios/HTTP error
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError<APIErrorResponse>;
    
    // Try to extract from response body
    if (axiosErr.response?.data) {
      const data = axiosErr.response.data;
      if (typeof data === 'object') {
        return (
          data.message ||
          data.details ||
          (typeof data.error === 'string' ? data.error : null) ||
          axiosErr.message ||
          `Error ${axiosErr.response?.status || ''}`
        );
      }
    }
    
    // Network error (no response)
    if (!axiosErr.response) {
      if (axiosErr.code === 'ECONNABORTED') {
        return 'Request timeout. Please check your connection and try again.';
      }
      if (axiosErr.code === 'ERR_NETWORK') {
        return 'Network error. Please check your connection.';
      }
      return axiosErr.message || 'Network request failed';
    }
    
    // HTTP status-based messages
    switch (axiosErr.response.status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Session expired. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'Resource not found.';
      case 409:
        return 'Conflict: This resource may have been modified. Please refresh and try again.';
      case 422:
        return 'Validation error: Please check your input.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'Server error. Please try again later.';
      default:
        return axiosErr.message || `Error: ${axiosErr.response.status}`;
    }
  }
  
  // Error object
  if (error instanceof Error) {
    return error.message;
  }
  
  // Unknown error
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Error handler type for use with TanStack Query
 */
export type QueryErrorHandlerCallback = (
  message: string,
  error: unknown
) => void | Promise<void>;

/**
 * Create a global error handler that can be used with TanStack Query
 * This function returns a handler that accepts TQ error events
 */
export function createGlobalErrorHandler(
  onError: QueryErrorHandlerCallback
) {
  return (error: unknown) => {
    const message = extractErrorMessage(error);
    onError(message, error);
  };
}

/**
 * Log error for debugging (console in dev, monitoring in prod)
 */
export function logQueryError(context: string, error: unknown) {
  if (import.meta.env.DEV) {
    console.error(`[Query Error: ${context}]`, error);
  } else {
    console.error(`[Query Error: ${context}]`, extractErrorMessage(error));
  }
}
