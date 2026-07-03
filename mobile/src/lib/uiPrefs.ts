import { createMMKV } from 'react-native-mmkv';

/**
 * MMKV-backed UI preferences (separate instance from session/query storage so
 * clearing caches never wipes user chrome state).
 */
const storage = createMMKV({ id: 'foxon-ui' });

const COLLAPSED_GROUPS_KEY = 'review.collapsedGroups';

/** Only collapsed keys are stored, so new week/month groups default to expanded. */
export function loadCollapsedGroups(): Set<string> {
  const raw = storage.getString(COLLAPSED_GROUPS_KEY);
  if (!raw) return new Set();
  try {
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    storage.remove(COLLAPSED_GROUPS_KEY);
    return new Set();
  }
}

export function saveCollapsedGroups(collapsed: ReadonlySet<string>): void {
  storage.set(COLLAPSED_GROUPS_KEY, JSON.stringify([...collapsed]));
}
