import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';
import { ProgressionState, SessionStatus } from '@prisma/client';
import { FoxLevelService } from '@/services/FoxLevelService';
import { getWeekBounds } from '@/lib/utils/dateUtils';

export interface UserProfile {
  id: string;
  clerkUserId: string;
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  weeklyGoal: number;
  foxLevel: ProgressionState;
  foxFormScore: number;
  /** @deprecated Use foxLevel instead */
  progressionState: ProgressionState;
  ouraConnected: boolean;
  ouraConnectedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStats {
  completedSessions: number;
  currentWeekStreak: number;
}

export interface TrainingPulseData {
  grid: boolean[][];
  totalSessions: number;
  weekStreak: number;
}

export interface ChronicleEntryInfo {
  state: 'brand_new' | 'no_chapter' | 'has_chapter';
  latestChapter?: {
    id: string;
    title: string;
    month: number;
    year: number;
  };
}

export interface ProfileData {
  user: UserProfile;
  stats: UserStats;
  firstSessionDate: Date | null;
  trainingPulse: TrainingPulseData;
  chronicleEntry: ChronicleEntryInfo;
}

export class ProfileService {
  /**
   * Get user profile with comprehensive stats
   */
  static async getUserProfile(): Promise<ProfileData | null> {
    const userId = await getCurrentUserId();

    try {
      const now = new Date();

      // One parallel wave. The full finished-session list (date only) is fetched
      // ONCE and reused for stats, first-session, week streak, and the heatmap
      // grid — replacing ~8 queries (incl. 3 duplicate all-session fetches) with 4.
      const [user, allSessions, latestChronicle, foxEval] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId } }),
        prisma.session.findMany({
          where: { userId, status: SessionStatus.FINISHED },
          orderBy: { date: 'desc' },
          select: { date: true },
        }),
        prisma.foxChronicle.findFirst({
          where: { userId },
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          select: { id: true, title: true, month: true, year: true },
        }),
        FoxLevelService.ensureEvaluated(userId),
      ]);

      if (!user) {
        return null;
      }

      const completedSessions = allSessions.length;
      const weekStreak = this.calculateWeekStreak(allSessions);
      // allSessions is date-desc, so the last element is the earliest session.
      const firstSessionDate = completedSessions > 0 ? allSessions[completedSessions - 1].date : null;

      const trainingPulse: TrainingPulseData = {
        grid: this.computePulseGrid(allSessions, now),
        totalSessions: completedSessions,
        weekStreak,
      };

      const chronicleEntry: ChronicleEntryInfo =
        completedSessions === 0
          ? { state: 'brand_new' }
          : latestChronicle
            ? { state: 'has_chapter', latestChapter: latestChronicle }
            : { state: 'no_chapter' };

      return {
        user: {
          id: user.id,
          clerkUserId: user.clerkUserId,
          displayName: user.displayName,
          email: user.email,
          avatarUrl: user.avatarUrl,
          weeklyGoal: user.weeklyGoal,
          foxLevel: foxEval.level,
          foxFormScore: foxEval.formScore,
          progressionState: foxEval.level,
          ouraConnected: !!user.ouraRefreshToken,
          ouraConnectedAt: user.ouraConnectedAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        stats: { completedSessions, currentWeekStreak: weekStreak },
        firstSessionDate,
        trainingPulse,
        chronicleEntry,
      };
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  }

  /**
   * Build the 12-week activity heatmap grid (7 days × 12 weeks) from an
   * in-memory finished-session list. Pure JS — no DB access.
   */
  private static computePulseGrid(sessions: { date: Date }[], now: Date): boolean[][] {
    const todayDay = now.getDay();
    const mondayOffset = todayDay === 0 ? -6 : 1 - todayDay;
    const thisMonday = new Date(now);
    thisMonday.setDate(now.getDate() + mondayOffset);
    thisMonday.setHours(0, 0, 0, 0);

    const gridStart = new Date(thisMonday);
    gridStart.setDate(thisMonday.getDate() - 11 * 7); // 11 weeks back

    const trainedDays = new Set<string>();
    sessions.forEach((s) => trainedDays.add(this.toDateKey(s.date)));

    const grid: boolean[][] = Array.from({ length: 7 }, () => Array(12).fill(false));
    for (let week = 0; week < 12; week++) {
      for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
        const cellDate = new Date(gridStart);
        cellDate.setDate(gridStart.getDate() + week * 7 + dayIdx);
        grid[dayIdx][week] = trainedDays.has(this.toDateKey(cellDate));
      }
    }
    return grid;
  }

  /**
   * Current week streak for a user. Thin public wrapper so other services
   * (e.g. the dashboard) can reuse the single-sourced streak math.
   */
  static async getWeekStreak(userId: string): Promise<number> {
    const sessions = await prisma.session.findMany({
      where: { userId, status: SessionStatus.FINISHED },
      orderBy: { date: 'desc' },
      select: { date: true },
    });

    return this.calculateWeekStreak(sessions);
  }

  /**
   * Calculate user statistics
   */
  private static async calculateUserStats(userId: string): Promise<UserStats> {
    const sessions = await prisma.session.findMany({
      where: {
        userId,
        status: SessionStatus.FINISHED
      },
      orderBy: { date: 'desc' },
      select: { date: true },
    });

    const completedSessions = sessions.length;
    const currentWeekStreak = this.calculateWeekStreak(sessions);

    return {
      completedSessions,
      currentWeekStreak,
    };
  }

  /**
   * Get training pulse grid data (12-week activity heatmap)
   */
  static async getTrainingPulseData(userId: string): Promise<TrainingPulseData> {
    const now = new Date();

    // Anchor from THIS week's Monday, go back 11 weeks
    const todayDay = now.getDay();
    const mondayOffset = todayDay === 0 ? -6 : 1 - todayDay;
    const thisMonday = new Date(now);
    thisMonday.setDate(now.getDate() + mondayOffset);
    thisMonday.setHours(0, 0, 0, 0);

    const gridStart = new Date(thisMonday);
    gridStart.setDate(thisMonday.getDate() - 11 * 7); // 11 weeks back

    const sessions = await prisma.session.findMany({
      where: {
        userId,
        status: SessionStatus.FINISHED,
        date: { gte: gridStart },
      },
      select: { date: true },
    });

    // Build set of trained day keys
    const trainedDays = new Set<string>();
    sessions.forEach(s => {
      const d = s.date;
      trainedDays.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    });

    const grid: boolean[][] = Array.from({ length: 7 }, () => Array(12).fill(false));

    for (let week = 0; week < 12; week++) {
      for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
        const cellDate = new Date(gridStart);
        cellDate.setDate(gridStart.getDate() + week * 7 + dayIdx);
        const key = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, '0')}-${String(cellDate.getDate()).padStart(2, '0')}`;
        grid[dayIdx][week] = trainedDays.has(key);
      }
    }

    // Total sessions all-time
    const totalSessions = await prisma.session.count({
      where: { userId, status: SessionStatus.FINISHED },
    });

    const allSessions = await prisma.session.findMany({
      where: { userId, status: SessionStatus.FINISHED },
      orderBy: { date: 'desc' },
      select: { date: true },
    });
    const weekStreak = this.calculateWeekStreak(allSessions);

    return { grid, totalSessions, weekStreak };
  }

  /**
   * Get chronicle entry info for profile card
   */
  static async getChronicleEntryInfo(userId: string): Promise<ChronicleEntryInfo> {
    const sessionCount = await prisma.session.count({
      where: { userId, status: SessionStatus.FINISHED },
    });

    if (sessionCount === 0) {
      return { state: 'brand_new' };
    }

    const latestChronicle = await prisma.foxChronicle.findFirst({
      where: { userId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      select: { id: true, title: true, month: true, year: true },
    });

    if (!latestChronicle) {
      return { state: 'no_chapter' };
    }

    return {
      state: 'has_chapter',
      latestChapter: latestChronicle,
    };
  }

  /**
   * Calculate current week streak
   */
  private static calculateWeekStreak(sessions: { date: Date }[]): number {
    if (sessions.length === 0) return 0;

    const sessionsByWeekStart = new Set<string>();
    sessions.forEach(session => {
      const weekStart = getWeekBounds(session.date).start;
      sessionsByWeekStart.add(this.toDateKey(weekStart));
    });

    const currentWeekStart = getWeekBounds(new Date()).start;
    let checkWeekStart = currentWeekStart;

    // Grace period: an unfinished current week does not break an existing streak.
    if (!sessionsByWeekStart.has(this.toDateKey(currentWeekStart))) {
      const previousWeek = new Date(currentWeekStart);
      previousWeek.setDate(previousWeek.getDate() - 7);
      checkWeekStart = previousWeek;
    }

    let streak = 0;

    while (sessionsByWeekStart.has(this.toDateKey(checkWeekStart))) {
      streak++;
      const previousWeek = new Date(checkWeekStart);
      previousWeek.setDate(previousWeek.getDate() - 7);
      checkWeekStart = previousWeek;
    }

    return streak;
  }

  /**
   * Format local date as YYYY-MM-DD for stable keying
   */
  private static toDateKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  /**
   * Update user profile information
   */
  static async updateUserProfile(updates: {
    displayName?: string;
    email?: string | null;
    avatarUrl?: string;
    weeklyGoal?: number;
    timezone?: string;
  }): Promise<UserProfile | null> {
    const userId = await getCurrentUserId();

    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(updates.displayName !== undefined && { displayName: updates.displayName }),
          ...(updates.email !== undefined && { email: updates.email }),
          ...(updates.avatarUrl !== undefined && { avatarUrl: updates.avatarUrl }),
          ...(updates.weeklyGoal !== undefined && { weeklyGoal: updates.weeklyGoal }),
          ...(updates.timezone !== undefined && { timezone: updates.timezone }),
        }
      });

      return {
        id: updatedUser.id,
        clerkUserId: updatedUser.clerkUserId,
        displayName: updatedUser.displayName,
        email: updatedUser.email,
        avatarUrl: updatedUser.avatarUrl,
        weeklyGoal: updatedUser.weeklyGoal,
        foxLevel: updatedUser.foxLevel,
        foxFormScore: updatedUser.foxFormScore,
        progressionState: updatedUser.foxLevel,
        ouraConnected: !!updatedUser.ouraRefreshToken,
        ouraConnectedAt: updatedUser.ouraConnectedAt,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      };
    } catch (error) {
      console.error('Failed to update user profile:', error);
      return null;
    }
  }

  /**
   * Get progression level information
   */
  static getProgressionInfo(state: ProgressionState): {
    name: string;
    emoji: string;
    description: string;
    nextLevel: string | null;
    progress: number;
  } {
    const progressionLevels = {
      SLIM: {
        name: 'Slim Fox',
        emoji: '🦊',
        description: 'Just starting your fitness journey',
        nextLevel: 'Fit Fox',
        progress: 25
      },
      FIT: {
        name: 'Fit Fox',
        emoji: '🦊',
        description: 'Building healthy habits',
        nextLevel: 'Strong Fox',
        progress: 50
      },
      STRONG: {
        name: 'Strong Fox',
        emoji: '💪',
        description: 'Getting seriously strong',
        nextLevel: 'Fiery Fox',
        progress: 75
      },
      FIERY: {
        name: 'Fiery Fox',
        emoji: '🔥',
        description: 'Peak performance achieved',
        nextLevel: null,
        progress: 100
      }
    };

    return progressionLevels[state];
  }
}
