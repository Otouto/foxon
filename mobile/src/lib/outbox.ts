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
// Server-assigned session ids for delivered completions — later watch seals
// arrive with only (workoutId, startTime) and need resolving to a session id.
const SENT_PREFIX = 'session_sent_';
const sentKeyFor = (id: string) => `${SENT_PREFIX}${id}`;

export interface SentSession {
  id: string;
  sessionId: string;
  workoutId: string;
  startTime: string | Date;
}

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
    storage.set(sentKeyFor(id), result.sessionId);
    return result;
  },

  /** Server session id for a delivered completion, if known. */
  sessionIdFor(id: string): string | null {
    return storage.getString(sentKeyFor(id)) ?? null;
  },

  hasPending(): boolean {
    return storage.getAllKeys().some((k: string) => k.startsWith(KEY_PREFIX));
  },

  /**
   * Retry every pending completion (called on sign-in and on app foreground).
   * Returns the sessions that reached the server (with their server ids).
   * Failures stay queued for the next flush.
   */
  async flush(): Promise<SentSession[]> {
    if (flushing) return [];
    flushing = true;
    const sent: SentSession[] = [];
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
          const id = key.slice(KEY_PREFIX.length);
          const result = await this.send(id, sessionData);
          sent.push({
            id,
            sessionId: result.sessionId,
            workoutId: sessionData.workoutId,
            startTime: sessionData.startTime,
          });
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

export interface PendingSeal {
  effort: string;
  vibeLine: string;
}

const SEAL_PREFIX = 'session_seal_';

/**
 * Durable queue for reflections captured on the watch. A seal can only be
 * POSTed once its session's server id is known (same idFor identity), so
 * entries wait here across flushes until the completion has been delivered.
 */
export const SealOutbox = {
  enqueue(id: string, seal: PendingSeal): void {
    storage.set(`${SEAL_PREFIX}${id}`, JSON.stringify(seal));
  },

  pending(): Array<{ id: string; seal: PendingSeal }> {
    return storage
      .getAllKeys()
      .filter((k: string) => k.startsWith(SEAL_PREFIX))
      .flatMap((key: string) => {
        const raw = storage.getString(key);
        if (!raw) return [];
        try {
          return [{ id: key.slice(SEAL_PREFIX.length), seal: JSON.parse(raw) as PendingSeal }];
        } catch {
          storage.remove(key);
          return [];
        }
      });
  },

  remove(id: string): void {
    storage.remove(`${SEAL_PREFIX}${id}`);
  },
};
