import type { ProgressionState } from '@/api/types';

interface FormScoreBreakdown {
  attendance: number;
  quality: number;
  consistency: number;
}

export type PillarKey = 'attendance' | 'quality' | 'consistency';

/**
 * What each form pillar measures and how to raise it — accurate to
 * FoxLevelService.calculateFormScore (src/services/FoxLevelService.ts).
 * Weights: Attendance 40% · Quality 35% · Consistency 25%.
 */
export const PILLAR_INFO: Record<
  PillarKey,
  { label: string; weight: number; describe: (weeklyGoal: number) => string }
> = {
  attendance: {
    label: 'Attendance',
    weight: 40,
    describe: (goal) =>
      `Sessions logged vs. your ${goal}×/week target. Train more often to raise it.`,
  },
  quality: {
    label: 'Quality',
    weight: 35,
    describe: () =>
      'How closely sessions matched their plan. Hit your planned sets, reps & loads.',
  },
  consistency: {
    label: 'Consistency',
    weight: 25,
    describe: () =>
      'Full weeks you hit your goal, last 6. String complete weeks together.',
  },
};

const NEXT_LEVEL: Record<ProgressionState, { label: string; at: number } | null> = {
  SLIM: { label: 'FIT', at: 40 },
  FIT: { label: 'STRONG', at: 65 },
  STRONG: { label: 'FIERY', at: 85 },
  FIERY: null,
};

/**
 * Eloquent "how to level up" line. Names the concrete form-score target (same
 * scale as the big score on the hero), using the same thresholds as
 * FoxLevelService (FIT 40 / STRONG 65 / FIERY 85).
 */
export function getNextLevelHint(state: ProgressionState, formScore: number): string {
  const next = NEXT_LEVEL[state];
  if (!next) return 'Peak form 🔥';
  if (formScore >= next.at) return `Ready to evolve into ${next.label}`;
  return `Reach ${next.at} to evolve into ${next.label}`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Turns the 3-pillar form breakdown into one plain-language line that tells the
 * user where they stand: what's dialed in and where they have room to grow.
 */
export function getFormInsight(
  breakdown: FormScoreBreakdown,
  hasNoSessions = false
): string {
  const { attendance, quality, consistency } = breakdown;

  if (hasNoSessions || (attendance === 0 && quality === 0 && consistency === 0)) {
    return "Let's build your first week.";
  }

  const pillars = [
    { label: 'attendance', value: attendance },
    { label: 'quality', value: quality },
    { label: 'consistency', value: consistency },
  ].sort((a, b) => b.value - a.value);

  const top = pillars[0];
  const bottom = pillars[pillars.length - 1];

  if (bottom.value >= 85) {
    return "Everything's clicking — keep the rhythm.";
  }
  if (top.value - bottom.value < 8) {
    return 'Steady across the board — keep stacking weeks.';
  }

  return `${capitalize(top.label)} is dialed in — ${bottom.label} is your edge.`;
}
