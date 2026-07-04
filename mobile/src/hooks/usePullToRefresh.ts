import { useCallback, useState } from 'react';

/**
 * Drives a RefreshControl from an explicit user pull only.
 *
 * Binding RefreshControl.refreshing to React Query's `isRefetching` makes the
 * spinner appear for background refetches (query invalidation on back-navigation,
 * focus refetch, stale-mount). On iOS a programmatically-set `refreshing` renders
 * as a stuck, non-animating spinner. This keeps the control tied to the gesture.
 */
export function usePullToRefresh(refetch: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return { refreshing, onRefresh };
}
