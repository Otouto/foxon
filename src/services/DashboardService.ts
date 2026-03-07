import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';
import { ProgressionState, SessionStatus, WorkoutStatus } from '@prisma/client';
import { computeFoxState } from '@/lib/utils/foxState';

export interface DashboardData {
  displayName: string | null;
  foxState: {
    state: ProgressionState;
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
   * Calculate fox progression state based on workout completion and devotion
   */
  private static calculateFoxState(
    completedWorkouts: number,
    plannedPerWeek: number,
    avgDevotionScore: number | null
  ): ProgressionState {
    const result = computeFoxState(completedWorkouts, plannedPerWeek * 8, avgDevotionScore);
    return ProgressionState[result as keyof typeof ProgressionState];
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

    // Get sessions from the last 8 weeks for fox state calculation
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

    const last8WeeksSessions = await prisma.session.findMany({
      where: {
        userId,
        status: SessionStatus.FINISHED,
        date: { gte: eightWeeksAgo }
      }
    });

    // Calculate average devotion score from last 8 weeks (for fox state computation)
    const sessionsWithDevotionScore = last8WeeksSessions.filter(s => s.devotionScore !== null);
    const averageDevotionScore8w = sessionsWithDevotionScore.length > 0
      ? Math.round(
          sessionsWithDevotionScore.reduce((sum, s) => sum + (s.devotionScore || 0), 0) /
          sessionsWithDevotionScore.length
        )
      : null;

    // Calculate fox state dynamically (still 8-week based)
    const foxState = this.calculateFoxState(
      last8WeeksSessions.length,
      user.weeklyGoal,
      averageDevotionScore8w
    );

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

    if (!isWeekComplete) {
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
        devotionScore: displayDevotionScore,
        isLastMonth,
        hasNoSessions,
        timePeriod: 'Last 8 weeks'
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

