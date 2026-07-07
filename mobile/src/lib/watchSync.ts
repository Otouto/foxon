import { api } from '@/api/client';
import { workoutPreloadQueryOptions, workoutsQueryOptions } from '@/api/queries';
import { queryClient } from '@/api/queryClient';
import {
  SealOutbox,
  SessionOutbox,
  type CompletedSessionPayload,
  type SentSession,
} from '@/lib/outbox';

import WatchConnectivity from '../../modules/watch-connectivity';

/**
 * Bridges the watchOS companion app.
 *
 * Down: ACTIVE workouts + their preload data (targets, previous session
 * loads/reps) are pushed as one JSON blob via applicationContext, so the watch
 * can start a session fully offline. Devotion results go back as queued
 * transfers once a completion reaches the server.
 *
 * Up: finished watch sessions and their optional seals arrive through a
 * native UserDefaults-backed queue (delivery can happen before JS boots), so
 * every notification triggers a full drain rather than carrying data itself.
 * Payloads are injected into the same durable outboxes the phone flow uses —
 * idempotent on (workoutId, startTime), so double-delivery is harmless.
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
          if (enqueueWatchSession(payload) || enqueueWatchSeal(payload)) received++;
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

/** Validates and queues a completed session sent by the watch. */
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

/** Validates and queues a reflection sealed on the watch. */
function enqueueWatchSeal(payload: Record<string, unknown>): boolean {
  if (payload.type !== 'session.seal' || typeof payload.json !== 'string') {
    return false;
  }
  let seal: { workoutId?: string; startTime?: string; effort?: string; vibeLine?: string };
  try {
    seal = JSON.parse(payload.json);
  } catch (error) {
    console.warn('[watchSync] unparseable seal payload from watch', error);
    return false;
  }
  if (!seal.workoutId || !seal.startTime || !seal.effort || !seal.vibeLine) {
    console.warn('[watchSync] malformed seal payload from watch');
    return false;
  }
  SealOutbox.enqueue(SessionOutbox.idFor(seal.workoutId, seal.startTime), {
    effort: seal.effort,
    vibeLine: seal.vibeLine,
  });
  return true;
}

/**
 * Deliver any workout completions stuck in the durable outbox (saved while
 * offline / app killed mid-save, or relayed from the watch), then any seals
 * whose sessions are now known. On success, refresh everything a new session
 * touches and reveal the devotion score on the watch.
 */
export async function flushOutbox() {
  const sent = SessionOutbox.hasPending() ? await SessionOutbox.flush() : [];
  if (sent.length > 0) {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['review'] });
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    queryClient.invalidateQueries({ queryKey: ['workout-preload'] });
  }
  await flushSeals();
  for (const session of sent) {
    void pushScoreToWatch(session);
  }
}

async function flushSeals() {
  for (const { id, seal } of SealOutbox.pending()) {
    const sessionId = SessionOutbox.sessionIdFor(id);
    if (!sessionId) continue; // completion not delivered yet — retry next flush
    try {
      await api.post(`/api/sessions/${sessionId}/seal`, seal);
      SealOutbox.remove(id);
      queryClient.invalidateQueries({ queryKey: ['review'] });
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
    } catch (error) {
      // Server rejections (already sealed, bad payload) won't heal on retry —
      // drop them; connectivity failures stay queued.
      if (!isNetworkError(error)) {
        console.warn('[watchSync] seal rejected by server, dropping', error);
        SealOutbox.remove(id);
      }
    }
  }
}

function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError || /network|offline|timed? ?out/i.test(String(error));
}

const SCORE_POLL_DELAYS_MS = [0, 1500, 3000, 5000, 8000];

/** Poll the freshly-computed devotion score and reveal it on the wrist. */
async function pushScoreToWatch({ sessionId, workoutId, startTime }: SentSession) {
  if (!WatchConnectivity?.isSupported) return;
  for (const delay of SCORE_POLL_DELAYS_MS) {
    if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
    try {
      const session = await api.get<{
        devotionScore: number | null;
        devotionGrade: string | null;
      }>(`/api/sessions/${sessionId}`);
      if (session.devotionScore != null) {
        await WatchConnectivity.transferUserInfo({
          type: 'session.result',
          json: JSON.stringify({
            workoutId,
            startTime: new Date(startTime).toISOString(),
            score: session.devotionScore,
            grade: session.devotionGrade,
          }),
        });
        return;
      }
    } catch {
      // transient — next delay retries
    }
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
