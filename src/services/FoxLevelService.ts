import { prisma } from '@/lib/prisma';
import { ProgressionState, SessionStatus } from '@prisma/client';

const WINDOW_DAYS = 42; // 6 weeks
const WINDOW_WEEKS = 6;

const LEVEL_THRESHOLDS: Record<ProgressionState, number> = {
  SLIM: 0,
  FIT: 40,
  STRONG: 65,
  FIERY: 85,
};

const LEVEL_ORDER: ProgressionState[] = ['SLIM', 'FIT', 'STRONG', 'FIERY'];

interface FormScoreBreakdown {
  attendance: number;
  quality: number;
  consistency: number;
  total: number;
}

interface WeekBucket {
  sessions: number;
  totalCDS: number;
  sessionCount: number;
}

/**
 * FoxLevelService — single source of truth for fox level (form rating).
 *
 * FormScore = Attendance(40%) + Quality(35%) + Consistency(25%)
 * evaluated over a 6-week rolling window.
 */
export class FoxLevelService {
  /**
   * Compute the form score for a user over the last 6 weeks.
   */
  static async computeFormScore(userId: string): Promise<FormScoreBreakdown> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { weeklyGoal: true },
    });
    if (!user) throw new Error('User not found');

    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - WINDOW_DAYS);

    const sessions = await prisma.session.findMany({
      where: {
        userId,
        status: SessionStatus.FINISHED,
        date: { gte: windowStart },
      },
      select: { date: true, devotionScore: true },
      orderBy: { date: 'asc' },
    });

    return this.calculateFormScore(sessions, user.weeklyGoal);
  }

  /**
   * Pure computation of form score from session data.
   * Exported for testing.
   */
  static calculateFormScore(
    sessions: Array<{ date: Date; devotionScore: number | null }>,
    weeklyGoal: number
  ): FormScoreBreakdown {
    const totalExpected = weeklyGoal * WINDOW_WEEKS;

    // Attendance: min(100, totalSessions / expectedSessions * 100)
    const attendance = totalExpected > 0
      ? Math.min(100, (sessions.length / totalExpected) * 100)
      : 0;

    // Quality: average CDS of all sessions (capped at 100)
    const scores = sessions
      .map(s => s.devotionScore)
      .filter((s): s is number => s !== null);
    const quality = scores.length > 0
      ? Math.min(100, scores.reduce((sum, s) => sum + s, 0) / scores.length)
      : 0;

    // Consistency: weeksAtGoal / 6 * 100 (binary per week)
    const weekBuckets = this.groupByISOWeek(sessions);
    let weeksAtGoal = 0;
    for (const bucket of weekBuckets.values()) {
      if (bucket.sessions >= weeklyGoal) weeksAtGoal++;
    }
    const consistency = (weeksAtGoal / WINDOW_WEEKS) * 100;

    const total = Math.round(
      attendance * 0.4 + quality * 0.35 + consistency * 0.25
    );

    return {
      attendance: Math.round(attendance),
      quality: Math.round(quality),
      consistency: Math.round(consistency),
      total,
    };
  }

  /**
   * Evaluate and persist the fox level for a user.
   * Applies stabilization buffer (2 consecutive evals for promo/demotion).
   * Hard override: 2+ weeks of zero sessions forces immediate demotion.
   */
  static async evaluateLevel(userId: string): Promise<{
    level: ProgressionState;
    formScore: number;
    changed: boolean;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        weeklyGoal: true,
        foxLevel: true,
        foxFormScore: true,
        foxPendingPromo: true,
        foxPendingDemote: true,
      },
    });
    if (!user) throw new Error('User not found');

    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - WINDOW_DAYS);

    const sessions = await prisma.session.findMany({
      where: {
        userId,
        status: SessionStatus.FINISHED,
        date: { gte: windowStart },
      },
      select: { date: true, devotionScore: true },
      orderBy: { date: 'asc' },
    });

    const { total: formScore } = this.calculateFormScore(sessions, user.weeklyGoal);
    const currentLevel = user.foxLevel;
    const targetLevel = this.scoreToLevel(formScore);

    let newLevel = currentLevel;
    let pendingPromo: string | null = user.foxPendingPromo;
    let pendingDemote: string | null = user.foxPendingDemote;

    // Hard override: 2+ consecutive weeks with zero sessions -> immediate demotion
    const consecutiveEmptyWeeks = this.getConsecutiveEmptyWeeksFromEnd(sessions);
    if (consecutiveEmptyWeeks >= 2 && LEVEL_ORDER.indexOf(targetLevel) < LEVEL_ORDER.indexOf(currentLevel)) {
      newLevel = targetLevel;
      pendingPromo = null;
      pendingDemote = null;
    } else if (LEVEL_ORDER.indexOf(targetLevel) > LEVEL_ORDER.indexOf(currentLevel)) {
      // Promotion path
      pendingDemote = null;
      if (pendingPromo === targetLevel) {
        // Second consecutive eval at/above threshold -> promote
        newLevel = targetLevel;
        pendingPromo = null;
      } else {
        // First eval -> mark pending
        pendingPromo = targetLevel;
      }
    } else if (LEVEL_ORDER.indexOf(targetLevel) < LEVEL_ORDER.indexOf(currentLevel)) {
      // Demotion path
      pendingPromo = null;
      if (pendingDemote === targetLevel) {
        // Second consecutive eval below threshold -> demote
        newLevel = targetLevel;
        pendingDemote = null;
      } else {
        // First eval -> mark pending
        pendingDemote = targetLevel;
      }
    } else {
      // Score matches current level — clear pending states
      pendingPromo = null;
      pendingDemote = null;
    }

    const changed = newLevel !== currentLevel;

    await prisma.user.update({
      where: { id: userId },
      data: {
        foxFormScore: formScore,
        foxLevel: newLevel,
        foxLastEvalAt: new Date(),
        foxPendingPromo: pendingPromo,
        foxPendingDemote: pendingDemote,
        // Keep progressionState in sync for backward compat
        progressionState: newLevel,
      },
    });

    return { level: newLevel, formScore, changed };
  }

  /**
   * Called after a session is completed and devotion-scored.
   * Triggers a full level evaluation.
   */
  static async onSessionCompleted(userId: string): Promise<void> {
    await this.evaluateLevel(userId);
  }

  /**
   * Lazy evaluation: if >24h since last eval, recompute.
   * Used on dashboard/profile load to catch inactivity decay.
   */
  static async ensureEvaluated(userId: string): Promise<{
    level: ProgressionState;
    formScore: number;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { foxLevel: true, foxFormScore: true, foxLastEvalAt: true },
    });
    if (!user) throw new Error('User not found');

    const hoursSinceEval = (Date.now() - user.foxLastEvalAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceEval >= 24) {
      const result = await this.evaluateLevel(userId);
      return { level: result.level, formScore: result.formScore };
    }

    return { level: user.foxLevel, formScore: user.foxFormScore };
  }

  // ─── Helpers ──────────────────────────────────────────────────────

  /**
   * Map a form score to a level.
   */
  static scoreToLevel(score: number): ProgressionState {
    if (score >= LEVEL_THRESHOLDS.FIERY) return 'FIERY';
    if (score >= LEVEL_THRESHOLDS.STRONG) return 'STRONG';
    if (score >= LEVEL_THRESHOLDS.FIT) return 'FIT';
    return 'SLIM';
  }

  /**
   * Group sessions by ISO week (Mon-Sun).
   */
  private static groupByISOWeek(
    sessions: Array<{ date: Date }>
  ): Map<string, WeekBucket> {
    const buckets = new Map<string, WeekBucket>();

    for (const session of sessions) {
      const d = new Date(session.date);
      const weekKey = this.getISOWeekKey(d);

      if (!buckets.has(weekKey)) {
        buckets.set(weekKey, { sessions: 0, totalCDS: 0, sessionCount: 0 });
      }

      const bucket = buckets.get(weekKey)!;
      bucket.sessions++;
    }

    return buckets;
  }

  /**
   * Get ISO week key (YYYY-Www) for a date.
   */
  private static getISOWeekKey(date: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const yearStart = new Date(d.getFullYear(), 0, 4);
    const weekNo = 1 + Math.round(
      ((d.getTime() - yearStart.getTime()) / 86400000 - 3 + ((yearStart.getDay() + 6) % 7)) / 7
    );
    return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }

  /**
   * Count consecutive weeks with zero sessions counting back from the current week.
   */
  private static getConsecutiveEmptyWeeksFromEnd(
    sessions: Array<{ date: Date }>
  ): number {
    const now = new Date();
    let count = 0;

    for (let weeksBack = 0; weeksBack < WINDOW_WEEKS; weeksBack++) {
      const weekStart = new Date(now);
      // Go to Monday of the target week
      const day = weekStart.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      weekStart.setDate(weekStart.getDate() + mondayOffset - weeksBack * 7);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const hasSession = sessions.some(s => {
        const d = new Date(s.date);
        return d >= weekStart && d <= weekEnd;
      });

      if (!hasSession) {
        count++;
      } else {
        break;
      }
    }

    return count;
  }
}
