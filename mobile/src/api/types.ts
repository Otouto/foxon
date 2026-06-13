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
  /** Current consecutive-week training streak (for the home greeting whisper). */
  weekStreak: number;
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
    id: string;
    displayName: string | null;
    email: string | null;
    avatarUrl: string | null;
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
    grid: boolean[][];
    totalSessions: number;
    weekStreak: number;
  };
  chronicleEntry: {
    state: 'brand_new' | 'no_chapter' | 'has_chapter';
    latestChapter?: {
      id: string;
      title: string;
      month: number;
      year: number;
    };
  };
}

export interface ChronicleListItem {
  id: string;
  month: number;
  year: number;
  chapterNumber: number;
  title: string;
  contentMd: string;
  contentHtml: string | null;
  emailSentAt: string | null;
  createdAt: string;
}
