import { createMMKV } from 'react-native-mmkv';

import type { InMemorySession } from '@/hooks/useInMemorySession';

/**
 * MMKV-backed persistence for the active workout session.
 * Mirrors the public API of the web's SessionStorageManager (src/lib/SessionStorageManager.ts),
 * but writes synchronously — MMKV is fast enough that the web's debounce layer is unnecessary.
 * Key scheme matches web: workout_session_<workoutId>.
 */
const storage = createMMKV({ id: 'foxon-session' });

const keyFor = (workoutId: string) => `workout_session_${workoutId}`;

export const SessionStorage = {
  getSession(workoutId: string): InMemorySession | null {
    const raw = storage.getString(keyFor(workoutId));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as InMemorySession;
    } catch {
      storage.remove(keyFor(workoutId));
      return null;
    }
  },

  saveSession(workoutId: string, session: InMemorySession): void {
    storage.set(keyFor(workoutId), JSON.stringify(session));
  },

  clearSession(workoutId: string): void {
    storage.remove(keyFor(workoutId));
  },

  hasSession(workoutId: string): boolean {
    return storage.contains(keyFor(workoutId));
  },

  /** Any active session, regardless of workout (for resume prompts). */
  getAnySessionWorkoutId(): string | null {
    const key = storage.getAllKeys().find((k: string) => k.startsWith('workout_session_'));
    return key ? key.replace('workout_session_', '') : null;
  },
};
