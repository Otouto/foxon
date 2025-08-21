import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';
import { ProgressionState, SessionStatus } from '@prisma/client';

export interface UserProfile {
  id: string;
  clerkUserId: string;
  displayName: string | null;
  avatarUrl: string | null;
  weeklyGoal: number;
  progressionState: ProgressionState;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStats {
  completedSessions: number;
  currentWeekStreak: number;
  averageDevotionScore?: number; // Average devotion score from completed sessions
}

export interface ProfileData {
  user: UserProfile;
  stats: UserStats;
}

export class ProfileService {
  /**
   * Get user profile with comprehensive stats
   */
  static async getUserProfile(): Promise<ProfileData | null> {
    const userId = getCurrentUserId();
    
    try {
      // Get user profile data
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return null;
      }

      // Get user statistics
      const stats = await this.calculateUserStats(userId);

      return {
        user: {
          id: user.id,
          clerkUserId: user.clerkUserId,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          weeklyGoal: user.weeklyGoal,
          progressionState: user.progressionState,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        stats
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
    // Get all user sessions
    const sessions = await prisma.session.findMany({
      where: { 
        userId,
        status: SessionStatus.FINISHED 
      },
      orderBy: { date: 'desc' }
    });

    // Calculate basic stats
    const completedSessions = sessions.length;
    
    // TODO: Re-enable devotion score calculation once TypeScript cache refreshes
    // Calculate average devotion score from sessions that have one
    // const sessionsWithDevotionScore = sessions.filter(session => session.devotionScore !== null);
    // const averageDevotionScore = sessionsWithDevotionScore.length > 0 
    //   ? sessionsWithDevotionScore.reduce((sum, session) => sum + (session.devotionScore || 0), 0) / sessionsWithDevotionScore.length
    //   : undefined;

    // Calculate current week streak
    const currentWeekStreak = this.calculateWeekStreak(sessions);

    return {
      completedSessions,
      currentWeekStreak,
      // averageDevotionScore: averageDevotionScore ? Math.round(averageDevotionScore) : undefined
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

    // Group sessions by week
    const sessionsByWeek = new Map<string, number>();
    sessions.forEach(session => {
      const weekKey = `${session.date.getFullYear()}-${this.getWeekNumber(session.date)}`;
      sessionsByWeek.set(weekKey, (sessionsByWeek.get(weekKey) || 0) + 1);
    });

    // Count consecutive weeks with sessions
    while (true) {
      const weekKey = `${checkYear}-${checkWeek}`;
      if (sessionsByWeek.has(weekKey)) {
        streak++;
        // Move to previous week
        checkWeek--;
        if (checkWeek < 1) {
          checkWeek = 52; // Approximate, could be 53
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
    avatarUrl?: string;
    weeklyGoal?: number;
  }): Promise<UserProfile | null> {
    const userId = getCurrentUserId();

    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(updates.displayName !== undefined && { displayName: updates.displayName }),
          ...(updates.avatarUrl !== undefined && { avatarUrl: updates.avatarUrl }),
          ...(updates.weeklyGoal !== undefined && { weeklyGoal: updates.weeklyGoal }),
        }
      });

      return {
        id: updatedUser.id,
        clerkUserId: updatedUser.clerkUserId,
        displayName: updatedUser.displayName,
        avatarUrl: updatedUser.avatarUrl,
        weeklyGoal: updatedUser.weeklyGoal,
        progressionState: updatedUser.progressionState,
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
    progress: number; // 0-100
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
