import { useAuth } from '@clerk/clerk-expo';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { profileQueryOptions } from '@/api/profile';
import {
  dashboardQueryOptions,
  workoutPreloadQueryOptions,
  workoutsQueryOptions,
} from '@/api/queries';
import { queryClient } from '@/api/queryClient';
import { clearPersistedCache } from '@/api/persister';
import { exercisesReviewQueryOptions, sessionsReviewQueryOptions } from '@/api/review';
import { SessionOutbox } from '@/lib/outbox';

/**
 * Deliver any workout completions stuck in the durable outbox (saved while
 * offline / app killed mid-save). On success, refresh everything a new
 * session touches.
 */
async function flushOutbox() {
  if (!SessionOutbox.hasPending()) return;
  const sent = await SessionOutbox.flush();
  if (sent > 0) {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['review'] });
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    queryClient.invalidateQueries({ queryKey: ['workout-preload'] });
  }
}

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
      ]).then(() => {
        // Second wave: warm session preloads for active workouts so tapping
        // "Start" opens the logging screen without a network wait.
        const workouts = queryClient.getQueryData(workoutsQueryOptions().queryKey);
        const active = (workouts ?? []).filter((w) => w.status === 'ACTIVE').slice(0, 6);
        void Promise.all(
          active.map((w) => queryClient.prefetchQuery(workoutPreloadQueryOptions(w.id)))
        );
      });
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

  // Retry stranded session completions on sign-in and whenever the app
  // returns to the foreground (e.g. connectivity came back).
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    void flushOutbox();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void flushOutbox();
    });
    return () => subscription.remove();
  }, [isSignedIn, isLoaded]);

  return null;
}
