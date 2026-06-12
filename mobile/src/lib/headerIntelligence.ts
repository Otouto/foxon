// Synced from src/lib/utils/headerIntelligence.ts — keep in sync with the web app.
interface SessionData {
  date: Date;
  devotionScore?: number | null;
}

export function getCurrentDayOfWeek(): number {
  return new Date().getDay(); // 0 = Sunday, 6 = Saturday
}

export function calculateMomentum<T extends SessionData>(sessions: T[]): 'building' | 'steady' | 'fading' | 'none' {
  if (sessions.length === 0) return 'none';
  if (sessions.length < 3) return 'building';

  const sortedSessions = [...sessions].sort((a, b) => a.date.getTime() - b.date.getTime());
  const recentSessions = sortedSessions.slice(-4);
  
  if (recentSessions.length < 3) return 'building';
  
  const intervals = [];
  for (let i = 1; i < recentSessions.length; i++) {
    const daysDiff = Math.abs(
      (recentSessions[i].date.getTime() - recentSessions[i-1].date.getTime()) / (1000 * 60 * 60 * 24)
    );
    intervals.push(daysDiff);
  }
  
  const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  const recentInterval = intervals[intervals.length - 1];
  
  if (recentInterval <= avgInterval * 0.8) return 'building';
  if (recentInterval <= avgInterval * 1.2) return 'steady';
  return 'fading';
}

export function generateWeeklyHeader(planned: number, completed: number, currentDayOfWeek: number): string {
  const remaining = planned - completed;
  const daysLeft = 7 - currentDayOfWeek;
  
  if (completed === 0) {
    if (currentDayOfWeek < 3) return `${planned} planned • Week is young`;
    if (currentDayOfWeek < 5) return `${planned} planned • Time to start`;
    return `${planned} planned • Still time this week`;
  }
  
  if (completed >= planned) return `${completed} of ${planned} • Week complete 🟢`;
  
  if (remaining === 1) {
    if (daysLeft >= 3) return `${completed} of ${planned} • One more to go`;
    return `${completed} of ${planned} • Finish strong`;
  }
  
  if (completed / planned > 0.5) return `${completed} of ${planned} • On track`;
  
  return `${completed} of ${planned} • Let's go`;
}

export function generateMonthlyHeader<T extends SessionData>(
  sessions: T[], 
  avgDevotion?: number
): string {
  const sessionCount = sessions.length;
  const momentum = calculateMomentum(sessions);
  
  if (momentum === 'building') return `${sessionCount} sessions • Building momentum`;
  if (momentum === 'steady') {
    const devotionText = avgDevotion ? `${avgDevotion}% steady practice` : 'Steady practice';
    return `${sessionCount} sessions • ${devotionText}`;
  }
  if (momentum === 'fading') return `${sessionCount} sessions • Reconnect to practice`;
  if (sessionCount === 0) return `Start your month`;
  
  const devotionText = avgDevotion ? `${avgDevotion}% devotion` : 'Building consistency';
  return `${sessionCount} sessions • ${devotionText}`;
}