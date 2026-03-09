import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';
import { ProgressionState, SessionStatus, WorkoutStatus } from '@prisma/client';
import { FoxLevelService } from '@/services/FoxLevelService';

export interface DashboardData {
  displayName: string | null;
  foxState: {
    state: ProgressionState;
    formScore: number;
    formScoreBreakdown: { attendance: number; quality: number; consistency: number };
    devotionScore: number | null;
    isLastMonth: boolean;
    hasNoSessions: boolean;
    timePeriod: string;
  };
  weekProgress: {
    completed: number;
    planned: number;
    isComplete: boolean;
    isExceeded: boolean;
    extra: number;
  };
  nextWorkout: {
    id: string;
    title: string;
    exerciseCount: number;
    estimatedDuration: number;
  } | null;
  lastSession: {
    id: string;
    workoutTitle: string;
    date: string;
    devotionScore: number | null;
    vibeLine: string | null;
  } | null;
}

export class DashboardService {
  /**
   * Get this week's session progress vs. weekly goal
   */
  static async getWeekProgress(): Promise<{ completed: number; planned: number }> {
    const userId = getCurrentUserId();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { weeklyGoal: true },
    });

    if (!user) throw new Error('User not found');

    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + mondayOffset);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const completed = await prisma.session.count({
      where: {
        userId,
        status: SessionStatus.FINISHED,
        date: { gte: startOfWeek, lte: endOfWeek },
      },
    });

    return { completed, planned: user.weeklyGoal };
  }

  /**
   * Get all dashboard data
   */
  static async getDashboardData(): Promise<DashboardData> {
    const userId = getCurrentUserId();

    // Get user profile
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Fox level: read from DB, lazy-evaluate if stale (>24h)
    const { level: foxState, formScore: foxFormScore } = await FoxLevelService.ensureEvaluated(userId);
    const { attendance, quality, consistency } = await FoxLevelService.computeFormScore(userId);

    // Month-aware devotion for display
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

    let displayDevotionScore: number | null = null;
    let isLastMonth = false;
    let hasNoSessions = false;

    if (currentMonthSessions.length > 0) {
      displayDevotionScore = Math.round(
        currentMonthSessions.reduce((sum, s) => sum + (s.devotionScore || 0), 0) /
        currentMonthSessions.length
      );
    } else {
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
        displayDevotionScore = Math.round(
          prevMonthSessions.reduce((sum, s) => sum + (s.devotionScore || 0), 0) /
          prevMonthSessions.length
        );
        isLastMonth = true;
      } else {
        // Check if user has any sessions at all
        const anySession = await prisma.session.findFirst({
          where: { userId, status: SessionStatus.FINISHED },
        });
        hasNoSessions = !anySession;
      }
    }

    // Get this week's sessions (Monday to Sunday)
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday, go back 6 days, else go to Monday
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + mondayOffset);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const thisWeekSessions = await prisma.session.findMany({
      where: {
        userId,
        status: SessionStatus.FINISHED,
        date: {
          gte: startOfWeek,
          lte: endOfWeek
        }
      }
    });

    const completedThisWeek = thisWeekSessions.length;
    const weeklyGoal = user.weeklyGoal;
    const isWeekComplete = completedThisWeek >= weeklyGoal;
    const isExceeded = completedThisWeek > weeklyGoal;
    const extra = isExceeded ? completedThisWeek - weeklyGoal : 0;

    // Get next workout: first active not done this week (ordered by createdAt asc)
    // If all done or none exist, show first active (repeat allowed)
    let nextWorkout: DashboardData['nextWorkout'] = null;

    const activeWorkouts = await prisma.workout.findMany({
      where: {
        userId,
        status: WorkoutStatus.ACTIVE
      },
      include: {
        workoutItems: {
          include: {
            workoutItemSets: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    const doneThisWeek = new Set(
      thisWeekSessions
        .map((s) => s.workoutId)
        .filter((id): id is string => id !== null)
    );

    const workout =
      activeWorkouts.find((w) => !doneThisWeek.has(w.id)) ??
      activeWorkouts[0];

    if (workout) {
      const exerciseCount = workout.workoutItems.length;
      const totalSets = workout.workoutItems.reduce(
        (total, item) => total + item.workoutItemSets.length,
        0
      );
      const estimatedDuration = totalSets * 3 + Math.max(0, exerciseCount - 1);

      nextWorkout = {
        id: workout.id,
        title: workout.title,
        exerciseCount,
        estimatedDuration
      };
    }

    // Get last session within 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentSession = await prisma.session.findFirst({
      where: {
        userId,
        status: SessionStatus.FINISHED,
        date: { gte: sevenDaysAgo },
      },
      orderBy: { date: 'desc' },
      include: {
        workout: { select: { title: true } },
        sessionSeal: { select: { vibeLine: true } },
      },
    });

    const lastSession: DashboardData['lastSession'] = recentSession
      ? {
          id: recentSession.id,
          workoutTitle: recentSession.workout?.title || 'Workout',
          date: recentSession.date.toISOString(),
          devotionScore: recentSession.devotionScore,
          vibeLine: recentSession.sessionSeal?.vibeLine || null,
        }
      : null;

    return {
      displayName: user.displayName,
      foxState: {
        state: foxState,
        formScore: foxFormScore,
        formScoreBreakdown: { attendance, quality, consistency },
        devotionScore: displayDevotionScore,
        isLastMonth,
        hasNoSessions,
        timePeriod: 'Last 6 weeks'
      },
      weekProgress: {
        completed: completedThisWeek,
        planned: weeklyGoal,
        isComplete: isWeekComplete,
        isExceeded,
        extra
      },
      nextWorkout,
      lastSession
    };
  }
}

