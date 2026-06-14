import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client';
import { createMMKV } from 'react-native-mmkv';

/**
 * MMKV-backed persister for the TanStack Query cache, so the app can paint
 * last-known data instantly on cold start instead of a blank spinner.
 *
 * MMKV v4 is synchronous and fast enough that no debounce is needed (mirrors
 * the approach in src/lib/sessionStorage.ts). Everything is JSON-serialized
 * under a single key.
 */
const storage = createMMKV({ id: 'foxon-query-cache' });

const CACHE_KEY = 'foxon-react-query';

/**
 * Bump this whenever the persisted query shapes change in a way that would make
 * old cached payloads invalid. PersistQueryClientProvider discards any restored
 * cache whose buster doesn't match (see persistOptions in _layout.tsx).
 */
export const CACHE_BUSTER = 'v1';

export const mmkvPersister: Persister = {
  persistClient(client: PersistedClient) {
    storage.set(CACHE_KEY, JSON.stringify(client));
  },
  restoreClient() {
    const raw = storage.getString(CACHE_KEY);
    if (!raw) return undefined;
    try {
      return JSON.parse(raw) as PersistedClient;
    } catch {
      storage.remove(CACHE_KEY);
      return undefined;
    }
  },
  removeClient() {
    storage.remove(CACHE_KEY);
  },
};

/** Drops the persisted cache from disk (used on sign-out). */
export function clearPersistedCache() {
  storage.remove(CACHE_KEY);
}
