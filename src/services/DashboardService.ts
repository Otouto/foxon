import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';
import { ProgressionState, SessionStatus, WorkoutStatus } from '@prisma/client';

export interface DashboardData {
  foxState: {
    state: ProgressionState;
    devotionScore: number | null;
    timePeriod: string;
  };
  weekProgress: {
    completed: number;
    planned: number;
    isComplete: boolean;
  };
  nextWorkout: {
    id: string;
    title: string;
    exerciseCount: number;
    estimatedDuration: number;
  } | null;
}

export class DashboardService {
  /**
   * Calculate fox progression state based on workout completion and devotion
   */
  private static calculateFoxState(
    completedWorkouts: number,
    plannedPerWeek: number,
    avgDevotionScore: number | null
  ): ProgressionState {
    const totalPlanned = plannedPerWeek * 8; // 8 weeks

    // Special case: Zero workouts = always SLIM
    if (completedWorkouts === 0) {
      return ProgressionState.SLIM;
    }

    // Special case: Perfect consistency = always FIERY
    if (completedWorkouts >= totalPlanned) {
      return ProgressionState.FIERY;
    }

    // Calculate base state based on completion percentage
    let baseState: ProgressionState;
    if (completedWorkouts < totalPlanned * 0.5) {
      baseState = ProgressionState.SLIM;        // 0-7 workouts (for goal of 2/week)
    } else if (completedWorkouts < totalPlanned * 0.75) {
      baseState = ProgressionState.FIT;         // 8-11 workouts
    } else if (completedWorkouts < totalPlanned) {
      baseState = ProgressionState.STRONG;      // 12-15 workouts
    } else {
      baseState = ProgressionState.FIERY;       // 16+ workouts
    }

    // Apply devotion score modifiers (only if enough data)
    if (completedWorkouts >= 4 && avgDevotionScore !== null) {
      // PROMOTION: High devotion score bumps up one level
      if (avgDevotionScore >= 90 && baseState !== ProgressionState.FIERY) {
        const promotionMap = {
          [ProgressionState.SLIM]: ProgressionState.FIT,
          [ProgressionState.FIT]: ProgressionState.STRONG,
          [ProgressionState.STRONG]: ProgressionState.FIERY,
          [ProgressionState.FIERY]: ProgressionState.FIERY,
        };
        return promotionMap[baseState];
      }
      
      // DEMOTION: Low devotion score drops down one level
      if (avgDevotionScore < 80 && baseState !== ProgressionState.SLIM) {
        const demotionMap = {
          [ProgressionState.SLIM]: ProgressionState.SLIM,
          [ProgressionState.FIT]: ProgressionState.SLIM,
          [ProgressionState.STRONG]: ProgressionState.FIT,
          [ProgressionState.FIERY]: ProgressionState.STRONG,
        };
        return demotionMap[baseState];
      }
    }

    return baseState;
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

    // Calculate average devotion score from last 8 weeks
    const sessionsWithDevotionScore = last8WeeksSessions.filter(s => s.devotionScore !== null);
    const averageDevotionScore = sessionsWithDevotionScore.length > 0
      ? Math.round(
          sessionsWithDevotionScore.reduce((sum, s) => sum + (s.devotionScore || 0), 0) / 
          sessionsWithDevotionScore.length
        )
      : null;

    // Calculate fox state dynamically
    const foxState = this.calculateFoxState(
      last8WeeksSessions.length,
      user.weeklyGoal,
      averageDevotionScore
    );

    // Get this week's sessions (Monday to Sunday)
    const now = new Date();
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

    // Get next workout (first active workout)
    let nextWorkout: DashboardData['nextWorkout'] = null;

    if (!isWeekComplete) {
      const workout = await prisma.workout.findFirst({
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
        orderBy: { updatedAt: 'desc' }
      });

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

    return {
      foxState: {
        state: foxState,
        devotionScore: averageDevotionScore,
        timePeriod: 'Last 8 weeks'
      },
      weekProgress: {
        completed: completedThisWeek,
        planned: weeklyGoal,
        isComplete: isWeekComplete
      },
      nextWorkout
    };
  }
}

