import { QueryClient, keepPreviousData } from '@tanstack/react-query';

/**
 * Single shared QueryClient so prefetch helpers (PrefetchOnAuth) and the React
 * tree write into the same cache.
 *
 * - staleTime 5m: navigating back to a screen serves cached data immediately and
 *   only revalidates in the background, instead of refetching on every visit.
 * - gcTime 24h: must be >= the persister maxAge or restored entries get evicted
 *   before they can be shown on cold start.
 * - keepPreviousData: smooth transitions when a query key changes (e.g. search).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      gcTime: 24 * 60 * 60_000,
      retry: 2,
      placeholderData: keepPreviousData,
    },
  },
});
