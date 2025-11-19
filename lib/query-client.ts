import { QueryClient } from '@tanstack/react-query';

/**
 * Creates a new QueryClient instance with optimized default options
 * for caching and data fetching strategies.
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 5 minutes
        staleTime: 5 * 60 * 1000,
        // Cache is kept for 10 minutes
        gcTime: 10 * 60 * 1000,
        // Refetch when window regains focus
        refetchOnWindowFocus: true,
        // Refetch when network reconnects
        refetchOnReconnect: true,
        // Retry failed requests up to 3 times
        retry: 3,
        // Exponential backoff with max 30s delay
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

/**
 * Gets or creates a QueryClient instance for the browser.
 * Ensures a single instance is used across the application.
 */
export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always create a new query client
    return makeQueryClient();
  } else {
    // Browser: reuse existing client or create new one
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
  }
}
