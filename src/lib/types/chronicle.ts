// Fox Chronicle — Monthly narrative summary types

export interface ChronicleTimeFrame {
  month: number; // 1-12
  year: number;
  chapterNumber: number;
  totalDaysInMonth: number;
  weekCount: number;
  weekBoundaries: Array<{ start: Date; end: Date }>;
  monthName: string; // "February 2026"
}

export interface ChroniclePreviousMonth {
  sessionCount: number;
  avgDevotion: number | null;
  bestScore: number | null;
  foxState: string;
  weeksAtGoal: string; // "2 of 4"
  totalVolume: number; // kg
  avgLF: number | null;
}

export interface ChronicleCurrentMonth {
  sessionCount: number;
  avgDevotion: number | null;
  bestScore: number | null;
  worstScore: number | null;
  foxStateStart: string;
  foxStateEnd: string;
  foxLeveledUp: boolean;
  weeksAtGoal: string; // "4 of 4"
  weeklyGoal: number;
  totalVolume: number;
  totalVolumeFormatted: string; // "22.9 tonnes"
  avgLF: number | null;
  avgLFGrade: string;
  isNewProgram: boolean;
  newWorkoutTitles: string[]; // titles appearing for the first time this month
}

export interface ChronicleSessionData {
  id: string;
  date: string; // ISO string
  dayOfWeek: string;
  timeOfDay: string;
  workoutTitle: string | null;
  devotionScore: number | null;
  devotionGrade: string | null;
  devotionLabel: string;
  pillars: {
    EC: number;
    SC: number;
    RF: number;
    LF?: number;
  };
  deviations: Array<{
    type: string;
    exerciseName: string;
    description: string;
    impact: number;
  }>;
  effort: string | null;
  vibeLine: string | null;
  note: string | null;
  duration: number | null;
  restDaysBefore: number | null;
  isComeback: boolean;
  weekNumber: number;
  sessionVolume: number;
  exerciseLoads: Array<{
    name: string;
    sets: Array<{ load: number; reps: number }>;
  }>;
  heaviestLift: { exercise: string; load: number; reps: number } | null;
}

export interface ChronicleWeekData {
  number: number;
  sessionCount: number;
  planned: number;
  hitGoal: boolean;
  exceeded: boolean;
  avgDevotion: number | null;
  bestScore: number | null;
  worstScore: number | null;
  scoreRange: string; // "91 → 94"
  dominantEffort: string | null;
  miniArc: string;
  totalVolume: number;
  avgLF: number | null;
}

export interface ChroniclePillarAnalysis {
  avgEC: number;
  avgSC: number;
  avgRF: number;
  avgLF: number | null;
  lfSessionCount: string; // "8 of 9"
  strongest: string;
  weakest: string;
  prevAvgEC: number | null;
  prevAvgSC: number | null;
  prevAvgRF: number | null;
  prevAvgLF: number | null;
  ecDelta: number | null;
  scDelta: number | null;
  rfDelta: number | null;
  lfDelta: number | null;
}

export interface ChronicleExerciseInsight {
  name: string;
  muscleGroup: string | null;
  sessionCount: number;
  peakLoad: number;
  peakReps: number;
  prevPeakLoad: number | null;
  isPR: boolean;
  totalVolume: number;
  prevTotalVolume: number | null;
  volumeDelta: string | null; // "+50%"
  avgLoad: number;
  prevAvgLoad: number | null;
  loadTrend: 'up' | 'stable' | 'down';
  loadProgression: number[];
  isBodyweight: boolean;
}

export interface ChronicleRhythm {
  longestStreak: string; // "3 sessions in 5 days"
  longestGap: string; // "3 days"
  longestGapDates: string; // "Feb 14 → Feb 17"
  cameBackFromGap: boolean;
  dominantDays: string; // "Tuesday (4×)"
  dominantTimeOfDay: string;
  effortDistribution: Record<string, number>;
  hardOrAbovePercent: number;
  sessionsWithVibeLines: number;
}

export interface ChronicleMilestone {
  type: string;
  label: string;
  detail: string;
  sessionId?: string;
  date?: string;
}

export interface ChronicleChapterContent {
  title: string;
  verdict: string;
  carryForward: string | null;
  threshold: string | null;
  ordeal: string;
  earnedTruth: string;
  numbers: string;
  nextTest: string;
}

export interface ChronicleDataPayload {
  timeFrame: ChronicleTimeFrame;
  previousMonth: ChroniclePreviousMonth | null;
  currentMonth: ChronicleCurrentMonth;
  sessions: ChronicleSessionData[];
  weeks: ChronicleWeekData[];
  pillars: ChroniclePillarAnalysis;
  exercises: ChronicleExerciseInsight[];
  rhythm: ChronicleRhythm;
  milestones: ChronicleMilestone[];
  userName: string;
}
