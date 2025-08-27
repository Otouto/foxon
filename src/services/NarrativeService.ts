import { prisma } from '@/lib/prisma';

export interface SessionData {
  id: string;
  date: Date;
  workoutTitle: string | null;
  devotionScore: number | null;
}

export interface NarrativeContext {
  currentSession: SessionData;
  previousSession: SessionData | null;
  sessionHistory: SessionData[];
  monthSessions: SessionData[];
  workoutFrequency: Map<string, number>;
}

export class NarrativeService {
  /**
   * Calculate contextual narrative for a session
   */
  static calculateNarrative(context: NarrativeContext): string | null {
    const { currentSession, previousSession, sessionHistory, monthSessions } = context;
    
    // Priority 1: Comeback messages (>5 days)
    if (previousSession) {
      const daysSinceLastSession = this.getDaysBetween(currentSession.date, previousSession.date);
      
      if (daysSinceLastSession > 7) {
        return "Welcome back - every return strengthens practice";
      }
      if (daysSinceLastSession > 5) {
        return `${daysSinceLastSession} days away - good to see you`;
      }
    }

    // Priority 2: Rhythm recognition (consistency)
    const consistencyMessage = this.getConsistencyMessage(currentSession, sessionHistory);
    if (consistencyMessage) return consistencyMessage;

    // Priority 3: Workout-specific patterns
    const workoutSpecificMessage = this.getWorkoutSpecificMessage(currentSession, sessionHistory);
    if (workoutSpecificMessage) return workoutSpecificMessage;

    // Priority 4: Month progress markers
    const monthProgressMessage = this.getMonthProgressMessage(currentSession, monthSessions);
    if (monthProgressMessage) return monthProgressMessage;

    // Priority 5: Encouraging progress notes
    const encouragingMessage = this.getEncouragingMessage(currentSession, sessionHistory);
    if (encouragingMessage) return encouragingMessage;

    return null; // No narrative if nothing notable
  }

  /**
   * Get narrative context for a user and session
   */
  static async getNarrativeContext(
    userId: string,
    sessionId: string,
    sessionDate: Date
  ): Promise<NarrativeContext> {
    // Get current session data
    const currentSession = await prisma.session.findFirst({
      where: { id: sessionId, userId },
      include: {
        workout: {
          select: { title: true }
        }
      }
    });

    if (!currentSession) {
      throw new Error('Session not found');
    }

    // Get previous session (most recent before current)
    const previousSession = await prisma.session.findFirst({
      where: {
        userId,
        status: 'FINISHED',
        date: { lt: sessionDate }
      },
      include: {
        workout: {
          select: { title: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    // Get session history (last 30 days for context)
    const thirtyDaysAgo = new Date(sessionDate);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sessionHistory = await prisma.session.findMany({
      where: {
        userId,
        status: 'FINISHED',
        date: { gte: thirtyDaysAgo, lt: sessionDate }
      },
      include: {
        workout: {
          select: { title: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    // Get current month sessions
    const startOfMonth = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), 1);
    const endOfMonth = new Date(sessionDate.getFullYear(), sessionDate.getMonth() + 1, 0);
    
    const monthSessions = await prisma.session.findMany({
      where: {
        userId,
        status: 'FINISHED',
        date: { gte: startOfMonth, lte: endOfMonth }
      },
      include: {
        workout: {
          select: { title: true }
        }
      },
      orderBy: { date: 'asc' }
    });

    // Calculate workout frequency
    const workoutFrequency = new Map<string, number>();
    sessionHistory.forEach(session => {
      const workoutName = session.workout?.title || 'Custom Workout';
      workoutFrequency.set(workoutName, (workoutFrequency.get(workoutName) || 0) + 1);
    });

    // Transform to our interface
    const transformSession = (session: {
      id: string;
      date: Date;
      devotionScore: number | null;
      workout: { title: string } | null;
    }): SessionData => ({
      id: session.id,
      date: session.date,
      workoutTitle: session.workout?.title || null,
      devotionScore: session.devotionScore
    });

    return {
      currentSession: transformSession(currentSession),
      previousSession: previousSession ? transformSession(previousSession) : null,
      sessionHistory: sessionHistory.map(transformSession),
      monthSessions: monthSessions.map(transformSession),
      workoutFrequency
    };
  }

  /**
   * Calculate days between two dates
   */
  private static getDaysBetween(date1: Date, date2: Date): number {
    const timeDifference = Math.abs(date1.getTime() - date2.getTime());
    return Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
  }

  /**
   * Get consistency/rhythm recognition message
   */
  private static getConsistencyMessage(
    currentSession: SessionData,
    sessionHistory: SessionData[]
  ): string | null {
    // Check for sessions this week
    const startOfWeek = new Date(currentSession.date);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const thisWeekSessions = sessionHistory.filter(session => {
      return session.date >= startOfWeek;
    });

    // Include current session in count
    const totalThisWeek = thisWeekSessions.length + 1;

    if (totalThisWeek === 3) {
      return "Building rhythm - 3rd this week";
    }
    if (totalThisWeek === 4) {
      return "Strong week - 4th session";
    }
    if (totalThisWeek >= 5) {
      return "On fire this week";
    }

    return null;
  }

  /**
   * Get workout-specific pattern message
   */
  private static getWorkoutSpecificMessage(
    currentSession: SessionData,
    sessionHistory: SessionData[]
  ): string | null {
    const workoutName = currentSession.workoutTitle;
    if (!workoutName) return null;

    // Find last time this workout was done
    const lastWorkoutSession = sessionHistory.find(session => 
      session.workoutTitle === workoutName
    );

    if (!lastWorkoutSession) {
      return `First ${workoutName}`;
    }

    const daysSinceLastWorkout = this.getDaysBetween(currentSession.date, lastWorkoutSession.date);
    
    if (daysSinceLastWorkout >= 14) {
      return `First ${workoutName} in ${daysSinceLastWorkout} days`;
    }

    return null;
  }

  /**
   * Get month progress marker message
   */
  private static getMonthProgressMessage(
    currentSession: SessionData,
    monthSessions: SessionData[]
  ): string | null {
    // Check if this is first of month
    if (currentSession.date.getDate() === 1 || monthSessions.length === 0) {
      return "Month started here";
    }

    // Check if this is personal best for the month
    const currentScore = currentSession.devotionScore;
    if (currentScore) {
      const monthScores = monthSessions
        .map(s => s.devotionScore)
        .filter((score): score is number => score !== null);
      
      const maxMonthScore = Math.max(...monthScores);
      if (currentScore > maxMonthScore) {
        return "Your strongest this month ⭐";
      }
    }

    return null;
  }

  /**
   * Get encouraging progress message
   */
  private static getEncouragingMessage(
    currentSession: SessionData,
    sessionHistory: SessionData[]
  ): string | null {
    // Check if devotion scores are improving (last 3 sessions)
    const recentSessions = sessionHistory
      .slice(0, 3)
      .filter(s => s.devotionScore !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (recentSessions.length >= 2) {
      const scores = recentSessions.map(s => s.devotionScore!);
      const isImproving = scores.every((score, index) => 
        index === 0 || score >= scores[index - 1]
      );

      if (isImproving && currentSession.devotionScore) {
        return "Finding your groove";
      }
    }

    // Check for consistent practice (3+ sessions in last 7 days)
    const lastWeek = new Date(currentSession.date);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const recentSessionCount = sessionHistory.filter(session => 
      session.date >= lastWeek
    ).length + 1; // Include current session

    if (recentSessionCount >= 3) {
      return "Practice is flowing";
    }

    return null;
  }
}