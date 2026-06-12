/**
 * Response shapes that live in web service files (which import Prisma and
 * can't be type-imported here). Mirrors:
 * - src/services/DashboardService.ts (DashboardData)
 * - src/app/api/sessions/review/route.ts (SessionReviewData)
 * - src/services/ProfileService.ts (ProfileData)
 * Keep in sync with the web app.
 */

export type ProgressionState = 'SLIM' | 'FIT' | 'STRONG' | 'FIERY';

export type EffortLevel =
  | 'EASY_1'
  | 'EASY_2'
  | 'EASY_3'
  | 'MODERATE_4'
  | 'MODERATE_5'
  | 'MODERATE_6'
  | 'HARD_7'
  | 'HARD_8'
  | 'ALL_OUT_9'
  | 'ALL_OUT_10';

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

export interface SessionReviewData {
  id: string;
  date: string;
  workoutTitle: string | null;
  status: string;
  devotionScore?: number | null;
  devotionGrade?: string | null;
  effort?: EffortLevel;
  vibeLine?: string;
  note?: string;
  duration?: number;
  narrative?: string;
}

export interface ProfileData {
  user: {
    displayName: string | null;
    email: string | null;
    weeklyGoal: number;
    foxLevel: ProgressionState;
    foxFormScore: number;
  };
  stats: {
    completedSessions: number;
    currentWeekStreak: number;
  };
  firstSessionDate: string | null;
  trainingPulse: {
    grid: number[][];
    totalSessions: number;
    weekStreak: number;
  };
  chronicleEntry: {
    id: string;
    title: string;
    month: number;
    year: number;
  } | null;
}
