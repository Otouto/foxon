import { useAuth } from '@clerk/clerk-expo';
import { useEffect, useRef } from 'react';

import { profileQueryOptions } from '@/api/profile';
import { dashboardQueryOptions, workoutsQueryOptions } from '@/api/queries';
import { queryClient } from '@/api/queryClient';
import { clearPersistedCache } from '@/api/persister';
import { exercisesReviewQueryOptions, sessionsReviewQueryOptions } from '@/api/review';

/**
 * Reacts to auth state to keep the cache fast and correct:
 *
 * - On sign-in, warms every tab's data in parallel so opening Home / Workouts /
 *   Review / Profile shows content immediately rather than a cold fetch.
 *   prefetchQuery respects staleTime, so it's a no-op when the (persisted) cache
 *   is still fresh.
 * - On an actual sign-out, wipes the in-memory and persisted cache so a
 *   different user can never see the previous user's data.
 *
 * Renders nothing; mount it inside the providers, next to <ApiAuthBinding />.
 */
export function PrefetchOnAuth() {
  const { isSignedIn, isLoaded } = useAuth();
  const wasSignedIn = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      wasSignedIn.current = true;
      void Promise.all([
        queryClient.prefetchQuery(dashboardQueryOptions()),
        queryClient.prefetchQuery(workoutsQueryOptions()),
        queryClient.prefetchQuery(profileQueryOptions()),
        queryClient.prefetchQuery(sessionsReviewQueryOptions()),
        queryClient.prefetchQuery(exercisesReviewQueryOptions()),
      ]);
      return;
    }

    // Only clear on a real sign-out (was signed in, now not). Guarding on
    // wasSignedIn avoids wiping the restored persisted cache during the brief
    // unauthenticated window on every cold start.
    if (wasSignedIn.current) {
      wasSignedIn.current = false;
      queryClient.clear();
      clearPersistedCache();
    }
  }, [isSignedIn, isLoaded]);

  return null;
}
