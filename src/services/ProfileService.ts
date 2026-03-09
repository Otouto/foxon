import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';
import { ProgressionState, SessionStatus } from '@prisma/client';
import { FoxLevelService } from '@/services/FoxLevelService';

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
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStats {
  completedSessions: number;
  currentWeekStreak: number;
}

export interface MonthAwareDevotion {
  score: number | null;
  isLastMonth: boolean;
  monthLabel?: string;
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
  monthAwareDevotion: MonthAwareDevotion;
  firstSessionDate: Date | null;
  trainingPulse: TrainingPulseData;
  chronicleEntry: ChronicleEntryInfo;
}

export class ProfileService {
  /**
   * Get user profile with comprehensive stats
   */
  static async getUserProfile(): Promise<ProfileData | null> {
    const userId = getCurrentUserId();

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return null;
      }

      const [stats, monthAwareDevotion, firstSession, trainingPulse, chronicleEntry, foxEval] =
        await Promise.all([
          this.calculateUserStats(userId),
          this.getMonthAwareDevotion(userId),
          prisma.session.findFirst({
            where: { userId, status: SessionStatus.FINISHED },
            orderBy: { date: 'asc' },
            select: { date: true },
          }),
          this.getTrainingPulseData(userId),
          this.getChronicleEntryInfo(userId),
          FoxLevelService.ensureEvaluated(userId),
        ]);

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
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        stats,
        monthAwareDevotion,
        firstSessionDate: firstSession?.date || null,
        trainingPulse,
        chronicleEntry,
      };
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
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
   * Get month-aware devotion score (current month, fallback to previous)
   */
  static async getMonthAwareDevotion(userId: string): Promise<MonthAwareDevotion> {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const currentMonthSessions = await prisma.session.findMany({
      where: {
        userId,
        status: SessionStatus.FINISHED,
        date: { gte: currentMonthStart },
        devotionScore: { not: null },
      },
      select: { devotionScore: true },
    });

    if (currentMonthSessions.length > 0) {
      const avg = Math.round(
        currentMonthSessions.reduce((sum, s) => sum + (s.devotionScore || 0), 0) /
        currentMonthSessions.length
      );
      return { score: avg, isLastMonth: false };
    }

    // Fallback to previous month
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const prevMonthSessions = await prisma.session.findMany({
      where: {
        userId,
        status: SessionStatus.FINISHED,
        date: { gte: prevMonthStart, lte: prevMonthEnd },
        devotionScore: { not: null },
      },
      select: { devotionScore: true },
    });

    if (prevMonthSessions.length > 0) {
      const avg = Math.round(
        prevMonthSessions.reduce((sum, s) => sum + (s.devotionScore || 0), 0) /
        prevMonthSessions.length
      );
      const monthLabel = prevMonthStart.toLocaleDateString('en-US', { month: 'short' });
      return { score: avg, isLastMonth: true, monthLabel };
    }

    return { score: null, isLastMonth: false };
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

    const now = new Date();
    const currentWeek = this.getWeekNumber(now);
    const currentYear = now.getFullYear();

    let streak = 0;
    let checkWeek = currentWeek;
    let checkYear = currentYear;

    const sessionsByWeek = new Map<string, number>();
    sessions.forEach(session => {
      const weekKey = `${session.date.getFullYear()}-${this.getWeekNumber(session.date)}`;
      sessionsByWeek.set(weekKey, (sessionsByWeek.get(weekKey) || 0) + 1);
    });

    while (true) {
      const weekKey = `${checkYear}-${checkWeek}`;
      if (sessionsByWeek.has(weekKey)) {
        streak++;
        checkWeek--;
        if (checkWeek < 1) {
          checkWeek = 52;
          checkYear--;
        }
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Get week number of the year
   */
  private static getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * Update user profile information
   */
  static async updateUserProfile(updates: {
    displayName?: string;
    email?: string | null;
    avatarUrl?: string;
    weeklyGoal?: number;
  }): Promise<UserProfile | null> {
    const userId = getCurrentUserId();

    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(updates.displayName !== undefined && { displayName: updates.displayName }),
          ...(updates.email !== undefined && { email: updates.email }),
          ...(updates.avatarUrl !== undefined && { avatarUrl: updates.avatarUrl }),
          ...(updates.weeklyGoal !== undefined && { weeklyGoal: updates.weeklyGoal }),
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
