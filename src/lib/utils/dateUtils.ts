import { generateWeeklyHeader, generateMonthlyHeader, getCurrentDayOfWeek } from './headerIntelligence';

export function formatDate(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  }
}

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric'
  });
}

export function formatDateWithWeekday(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
}

export interface PracticeTimeInfo {
  emoji: string;
  label: string;
}

export function getPracticeTimeInfo(date: Date): PracticeTimeInfo {
  const hour = date.getHours();
  
  if (hour >= 4 && hour < 7) {
    return { emoji: '🌅', label: 'Dawn practice' };
  } else if (hour >= 7 && hour < 12) {
    return { emoji: '☀️', label: 'Morning practice' };
  } else if (hour >= 12 && hour < 17) {
    return { emoji: '🌤️', label: 'Afternoon practice' };
  } else if (hour >= 17 && hour < 21) {
    return { emoji: '🌆', label: 'Evening practice' };
  } else {
    return { emoji: '🌙', label: 'Night practice' };
  }
}

export function getDevotionScoreLabel(score: number): string {
  if (score === 100) return 'Perfect Process';
  if (score >= 95) return 'Devoted';
  if (score >= 90) return 'Dialed In';
  if (score >= 85) return 'Solid Work';
  if (score >= 80) return 'Showed Up';
  return 'Practice';
}

export interface WeekBounds {
  start: Date;
  end: Date;
}

export function getWeekBounds(date: Date): WeekBounds {
  const start = new Date(date);
  const day = start.getDay();
  // Adjust so Monday = 0, Tuesday = 1, ..., Sunday = 6
  const adjustedDay = (day + 6) % 7;
  const diff = start.getDate() - adjustedDay;
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export function getCurrentWeekBounds(): WeekBounds {
  return getWeekBounds(new Date());
}

export function getLastWeekBounds(): WeekBounds {
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  return getWeekBounds(lastWeek);
}

export function getMonthKey(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });
}

export function isDateInWeek(date: Date, weekBounds: WeekBounds): boolean {
  return date >= weekBounds.start && date <= weekBounds.end;
}

export interface SessionGroup<T = { id: string; date: Date; devotionScore?: number | null }> {
  key: string;
  title: string;
  sessions: T[];
  summary: GroupSummary;
  type: 'week' | 'month';
}

export interface GroupSummary {
  totalSessions: number;
  plannedSessions?: number;
  averageDevotion?: number;
  status?: 'On track' | 'Keep going' | 'Catch up';
  intelligentHeader?: string;
}

export function calculateWeekStatus(completed: number, planned: number): 'On track' | 'Keep going' | 'Catch up' {
  if (completed >= planned) return 'On track';
  if (completed === planned - 1) return 'Keep going';
  return 'Catch up';
}

export function groupSessionsByTime<T extends { id: string; date: Date; devotionScore?: number | null }>(
  sessions: T[], 
  weeklyGoal: number
): SessionGroup<T>[] {
  const groups: SessionGroup<T>[] = [];
  const currentWeek = getCurrentWeekBounds();
  
  const thisWeekSessions = sessions.filter(s => isDateInWeek(s.date, currentWeek));
  
  if (thisWeekSessions.length > 0 || groups.length === 0) {
    const currentDay = getCurrentDayOfWeek();
    const intelligentHeader = generateWeeklyHeader(weeklyGoal, thisWeekSessions.length, currentDay);
    
    groups.push({
      key: 'this-week',
      title: 'This Week',
      sessions: thisWeekSessions,
      type: 'week',
      summary: {
        totalSessions: thisWeekSessions.length,
        plannedSessions: weeklyGoal,
        status: calculateWeekStatus(thisWeekSessions.length, weeklyGoal),
        intelligentHeader
      }
    });
  }
  
  const monthGroups: Record<string, T[]> = {};
  const weekSessionIds = new Set(thisWeekSessions.map(s => s.id));
  
  sessions.forEach(session => {
    if (!weekSessionIds.has(session.id)) {
      const monthKey = getMonthKey(session.date);
      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = [];
      }
      monthGroups[monthKey].push(session);
    }
  });
  
  Object.entries(monthGroups)
    .sort(([a], [b]) => {
      const dateA = new Date(monthGroups[a][0].date);
      const dateB = new Date(monthGroups[b][0].date);
      return dateB.getTime() - dateA.getTime();
    })
    .forEach(([monthKey, monthlySessions]) => {
      const devotionScores = monthlySessions
        .map(s => s.devotionScore)
        .filter((score): score is number => score !== null && score !== undefined);
      
      const averageDevotion = devotionScores.length > 0 
        ? Math.round(devotionScores.reduce((sum, score) => sum + score, 0) / devotionScores.length)
        : undefined;

      const intelligentHeader = generateMonthlyHeader(monthlySessions, averageDevotion);

      groups.push({
        key: monthKey.toLowerCase().replace(' ', '-'),
        title: monthKey,
        sessions: monthlySessions.sort((a, b) => b.date.getTime() - a.date.getTime()),
        type: 'month',
        summary: {
          totalSessions: monthlySessions.length,
          averageDevotion,
          intelligentHeader
        }
      });
    });

  return groups;
}