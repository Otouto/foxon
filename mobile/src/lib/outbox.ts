import { createMMKV } from 'react-native-mmkv';

import { api } from '@/api/client';
import type { DevotionDeviation, DevotionPillars } from '@/api/sessions';
import { SessionStorage } from '@/lib/sessionStorage';

/**
 * Durable outbox for session completions. The payload is persisted to MMKV
 * BEFORE the first network attempt and only removed on confirmed success, so a
 * finished workout can never be lost to bad gym connectivity or an app kill.
 * The backend is idempotent on (user, workout, startTime), so retries are safe.
 */

export interface CompletedSessionPayload {
  workoutId: string;
  workoutTitle: string;
  startTime: string | Date;
  endTime: string | Date;
  duration: number;
  exercises: Array<{
    exerciseId: string;
    exerciseName: string;
    order: number;
    notes?: string;
    sets: Array<{
      type: string;
      load: number;
      reps: number;
      completed: boolean;
      order: number;
      notes?: string;
    }>;
  }>;
}

export interface CompleteSessionResponse {
  success: boolean;
  sessionId: string;
  devotionScore: number | null;
  devotionGrade: string | null;
  devotionPillars: DevotionPillars | null;
  devotionDeviations: DevotionDeviation[] | null;
}

const storage = createMMKV({ id: 'foxon-outbox' });

const KEY_PREFIX = 'session_complete_';
const keyFor = (id: string) => `${KEY_PREFIX}${id}`;

let flushing = false;

export const SessionOutbox = {
  /** Stable identity of a completion attempt — matches the backend's idempotency key. */
  idFor(workoutId: string, startTime: string | Date): string {
    return `${workoutId}_${new Date(startTime).toISOString()}`;
  },

  enqueue(id: string, sessionData: CompletedSessionPayload): void {
    storage.set(keyFor(id), JSON.stringify(sessionData));
  },

  /** POST the completion; removes the outbox entry on confirmed success. */
  async send(id: string, sessionData: CompletedSessionPayload): Promise<CompleteSessionResponse> {
    const result = await api.post<CompleteSessionResponse>('/api/sessions/complete', {
      sessionData,
    });
    storage.remove(keyFor(id));
    return result;
  },

  hasPending(): boolean {
    return storage.getAllKeys().some((k: string) => k.startsWith(KEY_PREFIX));
  },

  /**
   * Retry every pending completion (called on sign-in and on app foreground).
   * Returns the number of sessions that reached the server. Failures stay
   * queued for the next flush.
   */
  async flush(): Promise<number> {
    if (flushing) return 0;
    flushing = true;
    let sent = 0;
    try {
      const keys = storage.getAllKeys().filter((k: string) => k.startsWith(KEY_PREFIX));
      for (const key of keys) {
        const raw = storage.getString(key);
        if (!raw) continue;
        let sessionData: CompletedSessionPayload;
        try {
          sessionData = JSON.parse(raw) as CompletedSessionPayload;
        } catch {
          storage.remove(key);
          continue;
        }
        try {
          await this.send(key.slice(KEY_PREFIX.length), sessionData);
          sent++;
          // The workout is safely logged — drop a matching live-session
          // snapshot so it isn't offered for "resume" again. Only if the
          // snapshot is the same run (same startTime), not a newer restart.
          const snapshot = SessionStorage.getSession(sessionData.workoutId);
          if (
            snapshot &&
            new Date(snapshot.startTime).toISOString() ===
              new Date(sessionData.startTime).toISOString()
          ) {
            SessionStorage.clearSession(sessionData.workoutId);
          }
        } catch {
          // still offline / server error — keep it queued
        }
      }
    } finally {
      flushing = false;
    }
    return sent;
  },
};
