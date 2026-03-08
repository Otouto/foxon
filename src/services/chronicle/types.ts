// Chronicle V2 — Deterministic Narrative Planner types

import type {
  ChronicleWeekData,
  ChroniclePillarAnalysis,
  ChronicleExerciseInsight,
  ChronicleRhythm,
  ChronicleMilestone,
  ChroniclePreviousMonth,
  ChronicleTimeFrame,
} from '@/lib/types/chronicle';

// ─── Fox State ───────────────────────────────────────────────────────────────

export type FoxState = 'SLIM' | 'FIT' | 'STRONG' | 'FIERY';

// ─── NextTest — structured live question for the next chapter ────────────────

export type NextTestKind =
  | 'consistency'   // Will they maintain a rhythm?
  | 'capacity'      // Will load/volume increase?
  | 'recovery'      // Will comeback quality hold?
  | 'pillar'        // Will a weak pillar improve?
  | 'rhythm'        // Will a timing pattern persist?
  | 'adaptation';   // Will a new program settle?

export interface NextTestMeta {
  subject: string;           // e.g. "Wednesday-Saturday rhythm"
  kind: NextTestKind;
  hypothesis: string;        // e.g. "The pattern will hold if sessions stay above 4"
  checks: NextTestCheck[];   // 2-4 concrete checks
}

export interface NextTestCheck {
  metric: string;            // e.g. "sessionCount", "avgDevotion", "weeklyGoalHitRate"
  operator: '>=' | '<=' | '>' | '<' | '==' | '!=';
  value: number;
  label: string;             // Human-readable: "At least 6 sessions"
}

// ─── ChapterMemory — persisted per chapter for continuity ────────────────────

export interface ChapterMemory {
  foxStateEnd: FoxState;
  title: string;
  earnedTruth: string;
  nextTest: NextTestMeta;
  activeThreads: string[];         // Up to 3 ongoing narrative threads
  userLanguageVault: string[];     // Notable vibe lines to reference later
  recentOrdealSessionIds: string[]; // Last 2-3 ordeal session IDs to avoid repeats
}

// ─── Canon — normalized output of buildCanon ─────────────────────────────────

export interface Canon {
  sessions: CanonSession[];
  sessionCount: number;
  weeklyGoal: number;
  monthlyTarget: number;
  hitRate: number;                  // 0-100
  avgDevotion: number | null;
  bestScore: number | null;
  worstScore: number | null;
  scoreVariance: number | null;
  foxStateStart: FoxState;
  foxStateEnd: FoxState;
  foxLeveledUp: boolean;
  isNewProgram: boolean;
  newWorkoutTitles: string[];
  isComeback: boolean;             // gap >= 10 days
  longestGapDays: number;
  hasPR: boolean;
  prExercises: string[];
  totalVolume: number;
  totalVolumeFormatted: string;
  weeks: ChronicleWeekData[];
  pillars: ChroniclePillarAnalysis;
  exercises: ChronicleExerciseInsight[];
  rhythm: ChronicleRhythm;
  milestones: ChronicleMilestone[];
  previousMonth: ChroniclePreviousMonth | null;
  timeFrame: ChronicleTimeFrame;
  userName: string;

  // Computed flags for threshold selection
  hasCapacityShift: boolean;       // Volume or load trend significantly up
  hasPRCluster: boolean;           // 3+ PRs in the month
  dominantTimeOfDay: string;
  dominantDays: string;
}

export interface CanonSession {
  id: string;
  date: string;
  dayOfWeek: string;
  timeOfDay: string;
  workoutTitle: string | null;
  devotionScore: number | null;
  devotionGrade: string | null;
  pillars: { EC: number; SC: number; RF: number; LF?: number };
  effort: string | null;
  vibeLine: string | null;
  note: string | null;
  duration: number | null;
  restDaysBefore: number | null;
  isComeback: boolean;
  weekNumber: number;
  sessionVolume: number;
  heaviestLift: { exercise: string; load: number; reps: number } | null;
}

// ─── ContinuityBridge — output of buildContinuityBridge ──────────────────────

export type BridgeVerdict = 'confirmed' | 'disproved' | 'complicated' | 'inconclusive';

export interface ContinuityBridge {
  previousTitle: string;
  previousNextTest: NextTestMeta;
  verdict: BridgeVerdict;
  checkResults: CheckResult[];
  summary: string;                // One-line summary for LLM
}

export interface CheckResult {
  check: NextTestCheck;
  actual: number | null;
  passed: boolean;
}

// ─── PatternClaim — claim + evidence + confidence ────────────────────────────

export interface PatternClaim {
  id: string;                     // Unique key: "rhythm_consistency", "pillar_identity", etc.
  claim: string;                  // Human-readable claim
  evidence: string[];             // Specific data points supporting it
  confidence: number;             // 0-100
  isConfirmed?: boolean;          // If this was a previous nextTest that was confirmed
}

// ─── Section evidence assignment ─────────────────────────────────────────────

export interface SectionEvidence {
  verdict: string[];
  carryForward: string[];
  threshold: string[];
  ordeal: string[];
  earnedTruth: string[];
}

// ─── NarrativePlan — the full LLM input ──────────────────────────────────────

export interface NarrativePlan {
  chapter: {
    number: number;
    monthName: string;
    userName: string;
  };
  numbers: {
    sessionCount: number;
    monthlyTarget: number;
    hitRate: number;
    avgDevotion: number | null;
    prevAvgDevotion: number | null;
    prevSessionCount: number | null;
    foxStateStart: FoxState;
    foxStateEnd: FoxState;
    prevFoxState: FoxState | null;
  };
  sections: {
    verdict: {
      dominantTheme: string;
      counterweight: string;
      groundingFact: string;
      evidence: string[];
    };
    carryForward: {
      bridge: ContinuityBridge;
      evidence: string[];
    } | null;
    threshold: {
      type: 'fox_state_change' | 'new_program' | 'comeback' | 'capacity_shift' | 'pr_cluster';
      detail: string;
      evidence: string[];
    } | null;
    ordeal: {
      session: CanonSession;
      reason: string;
      contrastSession?: CanonSession;
      evidence: string[];
    };
    earnedTruth: {
      claim: PatternClaim;
      evidence: string[];
    };
    nextTest: {
      meta: NextTestMeta;
      evidence: string[];
    };
  };
  style: {
    recentTitles: string[];
    bannedPhrases: string[];
  };
}
