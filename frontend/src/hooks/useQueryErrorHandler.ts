import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/contexts/KoraToastContext";
import { useAppStore } from "@/stores/useAppStore";

/**
 * Global error handler for TanStack Query
 * Integrates with ToastContext and useAppStore for consistent error handling
 */
export function useQueryErrorHandler() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  useEffect(() => {
    const handleError = (error: Error) => {
      console.error("Query error:", error);
      
      // Update global error state
      useAppStore.setState({ error: error.message });
      
      // Show toast notification
      showToast(error.message || "An unexpected error occurred");
    };

    // Set global error handler
    queryClient.setDefaultOptions({
      queries: {
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors
          if (error?.response?.status >= 400 && error?.response?.status < 500) {
            return false;
          }
          // Retry up to 2 times for other errors
          return failureCount < 2;
        }
      },
      mutations: {
        retry: false // Don't retry mutations by default
      }
    });

    return () => {
      // Reset to default options on cleanup
      queryClient.setDefaultOptions({
        queries: {},
        mutations: {}
      });
    };
  }, [queryClient, showToast]);
}
