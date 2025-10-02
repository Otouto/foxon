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

    // Get sessions from the last 4 weeks for devotion score
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const recentSessions = await prisma.session.findMany({
      where: {
        userId,
        status: SessionStatus.FINISHED,
        date: { gte: fourWeeksAgo }
      }
    });

    // Calculate average devotion score
    const sessionsWithDevotionScore = recentSessions.filter(s => s.devotionScore !== null);
    const averageDevotionScore = sessionsWithDevotionScore.length > 0
      ? Math.round(
          sessionsWithDevotionScore.reduce((sum, s) => sum + (s.devotionScore || 0), 0) / 
          sessionsWithDevotionScore.length
        )
      : null;

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
        state: user.progressionState,
        devotionScore: averageDevotionScore,
        timePeriod: 'Last 4 weeks'
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

