import { workoutPreloadQueryOptions, workoutsQueryOptions } from '@/api/queries';
import { queryClient } from '@/api/queryClient';
import { SessionOutbox, type CompletedSessionPayload } from '@/lib/outbox';

import WatchConnectivity from '../../modules/watch-connectivity';

/**
 * Bridges the watchOS companion app.
 *
 * Down: ACTIVE workouts + their preload data (targets, previous session
 * loads/reps) are pushed as one JSON blob via applicationContext, so the watch
 * can start a session fully offline.
 *
 * Up: finished watch sessions arrive through a native UserDefaults-backed
 * queue (delivery can happen before JS boots), so every notification triggers
 * a full drain rather than carrying data itself. Payloads are injected into
 * the same durable outbox the phone flow uses — idempotent on
 * (workoutId, startTime), so double-delivery is harmless.
 */
export function initWatchSync() {
  if (!WatchConnectivity?.isSupported) {
    return;
  }
  const watch = WatchConnectivity;

  const drain = () => {
    watch
      .consumePendingUserInfo()
      .then(async (payloads) => {
        let received = 0;
        for (const payload of payloads) {
          if (enqueueWatchSession(payload)) received++;
        }
        if (received > 0) {
          await flushOutbox();
          pushWorkoutsToWatch();
        }
      })
      .catch((error) => console.warn('[watchSync] failed to drain watch payloads', error));
  };

  watch.addListener('onUserInfoReceived', drain);
  drain();
  pushWorkoutsToWatch();
}

/** Validates and queues a session payload sent by the watch. */
function enqueueWatchSession(payload: Record<string, unknown>): boolean {
  if (payload.type !== 'session.complete' || typeof payload.json !== 'string') {
    return false;
  }
  let sessionData: CompletedSessionPayload;
  try {
    sessionData = JSON.parse(payload.json) as CompletedSessionPayload;
  } catch (error) {
    console.warn('[watchSync] unparseable session payload from watch', error);
    return false;
  }
  if (!sessionData?.workoutId || !sessionData.startTime || !Array.isArray(sessionData.exercises)) {
    console.warn('[watchSync] malformed session payload from watch');
    return false;
  }
  SessionOutbox.enqueue(SessionOutbox.idFor(sessionData.workoutId, sessionData.startTime), sessionData);
  return true;
}

/**
 * Deliver any workout completions stuck in the durable outbox (saved while
 * offline / app killed mid-save, or relayed from the watch). On success,
 * refresh everything a new session touches.
 */
export async function flushOutbox() {
  if (!SessionOutbox.hasPending()) return;
  const sent = await SessionOutbox.flush();
  if (sent > 0) {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['review'] });
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    queryClient.invalidateQueries({ queryKey: ['workout-preload'] });
  }
}

const MAX_WATCH_WORKOUTS = 6;

/**
 * Push ACTIVE workouts (with targets + previous-session ghosts) to the watch.
 * Reads from the React Query cache only — call after prefetches settle or
 * whenever the cache may have fresher data. applicationContext keeps just the
 * latest snapshot, so repeated pushes are cheap.
 */
export function pushWorkoutsToWatch() {
  if (!WatchConnectivity?.isSupported) {
    return;
  }
  const workouts = queryClient.getQueryData(workoutsQueryOptions().queryKey) ?? [];
  const active = workouts.filter((w) => w.status === 'ACTIVE').slice(0, MAX_WATCH_WORKOUTS);

  const synced = active.flatMap((workout) => {
    const preload = queryClient.getQueryData(workoutPreloadQueryOptions(workout.id).queryKey);
    if (!preload) return [];
    return [
      {
        id: workout.id,
        title: workout.title,
        lastSessionDate: preload.lastSessionDate,
        exercises: preload.workout.items.map((item) => ({
          itemId: item.id,
          exerciseId: item.exercise.id,
          name: item.exercise.name,
          order: item.order,
          blockId: item.blockId ?? null,
          blockOrder: item.blockOrder ?? null,
          equipment: item.exercise.equipment?.name ?? null,
          sets: item.sets.map((set) => ({
            type: set.type,
            targetLoad: set.targetLoad,
            targetReps: set.targetReps,
            order: set.order,
          })),
          previous: preload.previousSessionData[item.exercise.id] ?? null,
        })),
      },
    ];
  });

  if (synced.length === 0) return;

  WatchConnectivity.updateApplicationContext({
    json: JSON.stringify({ v: 1, sentAt: new Date().toISOString(), workouts: synced }),
  }).catch((error) => console.warn('[watchSync] failed to push workouts to watch', error));
}
