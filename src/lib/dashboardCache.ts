interface FoxStateCache {
  formScore: number;
  attendance: number;
  quality: number;
  consistency: number;
}

interface WeekProgressCache {
  completed: number;
  planned: number;
}

const FOX_STATE_KEY = 'foxon:foxState';
const WEEK_PROGRESS_KEY = 'foxon:weekProgress';
const LAST_SESSION_KEY = 'foxon:lastSessionId';

function safeGet<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // sessionStorage unavailable (private browsing, full quota, etc.)
  }
}

export const DashboardCache = {
  getFoxState: () => safeGet<FoxStateCache>(FOX_STATE_KEY),
  setFoxState: (data: FoxStateCache) => safeSet(FOX_STATE_KEY, data),

  getWeekProgress: () => safeGet<WeekProgressCache>(WEEK_PROGRESS_KEY),
  setWeekProgress: (data: WeekProgressCache) => safeSet(WEEK_PROGRESS_KEY, data),

  getLastSessionId: () => safeGet<string>(LAST_SESSION_KEY),
  setLastSessionId: (id: string) => safeSet(LAST_SESSION_KEY, id),
};
