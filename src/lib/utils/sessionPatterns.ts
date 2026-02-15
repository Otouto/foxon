import { SessionReviewData } from '@/hooks/useReviewData';

export interface RestDayAnalysis {
  restDays: number;
}

export interface SessionConnection {
  restAnalysis: RestDayAnalysis;
  showConnector: boolean;
  visualState: 'connected' | 'dots' | 'compressed' | 'extended';
  height: number;
}

/**
 * Calculate the number of rest days between two sessions
 */
export function calculateRestDays(olderSession: Date, newerSession: Date): number {
  // Normalize dates to start of day to avoid timezone issues
  const startDate = new Date(olderSession);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(newerSession);
  endDate.setHours(0, 0, 0, 0);
  
  // Calculate difference in days
  const diffTime = endDate.getTime() - startDate.getTime();
  const totalDaysBetween = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Rest days = total days between - 1 (exclude both session days)
  // Example: Aug 15 -> Aug 20 = 5 total days, 4 rest days (16,17,18,19)
  return Math.max(0, totalDaysBetween - 1);
}


/**
 * Check if a workout is a strength workout
 */
export function isStrengthWorkout(workoutTitle: string | null): boolean {
  if (!workoutTitle) return false;
  const lowerTitle = workoutTitle.toLowerCase();
  return lowerTitle.includes('силова') || lowerTitle.includes('strength');
}


/**
 * Check if a group should show connectors (has at least 2 sessions)
 */
export function shouldShowConnectors(sessions: SessionReviewData[]): boolean {
  return sessions.length >= 2;
}

/**
 * Calculate proportional spacing visuals based on rest days
 */
export function calculateProportionalVisuals(restDays: number): { visualState: 'connected' | 'dots' | 'compressed' | 'extended', height: number } {
  if (restDays === 0) {
    return {
      visualState: 'connected',
      height: 30 // Minimum connector height
    };
  } else if (restDays >= 1 && restDays <= 7) {
    return {
      visualState: 'dots',
      height: 30 + (restDays * 14) // Base + 14px per rest day
    };
  } else if (restDays <= 14) {
    return {
      visualState: 'compressed',
      height: 80 // Fixed height for compressed view
    };
  } else {
    return {
      visualState: 'extended',
      height: 60 // Fixed height for break indicator
    };
  }
}

/**
 * Analyze the connection between two consecutive sessions
 */
export function analyzeSessionConnection(
  previousSession: SessionReviewData,
  currentSession: SessionReviewData,
  groupShouldShowConnectors: boolean = true
): SessionConnection {
  const restDays = calculateRestDays(previousSession.date, currentSession.date);
  const restAnalysis: RestDayAnalysis = {
    restDays
  };
  
  const visuals = calculateProportionalVisuals(restDays);
  
  return {
    restAnalysis,
    showConnector: groupShouldShowConnectors,
    visualState: visuals.visualState,
    height: visuals.height
  };
}

/**
 * Get all session connections for a group of sessions
 */
export function getSessionConnections(sessions: SessionReviewData[]): SessionConnection[] {
  if (sessions.length < 2) return [];
  
  const groupShouldShow = shouldShowConnectors(sessions);
  const connections: SessionConnection[] = [];
  
  // Sort sessions by date (oldest first) for proper connection analysis
  const sortedSessions = [...sessions].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  for (let i = 1; i < sortedSessions.length; i++) {
    const previousSession = sortedSessions[i - 1];
    const currentSession = sortedSessions[i];
    
    const connection = analyzeSessionConnection(
      previousSession,
      currentSession,
      groupShouldShow
    );
    
    connections.push(connection);
  }
  
  return connections;
}