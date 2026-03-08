import type { Canon, NarrativePlan } from './types';

type ThresholdSection = NonNullable<NarrativePlan['sections']['threshold']>;

/**
 * selectPrimaryThreshold — picks the most significant threshold event.
 * Priority (first match wins):
 * 1. Fox state change
 * 2. New program
 * 3. Comeback (gap >= 10 days)
 * 4. Capacity shift / PR cluster
 * 5. null
 */
export function selectPrimaryThreshold(canon: Canon): ThresholdSection | null {
  // 1. Fox state change
  if (canon.foxLeveledUp) {
    return {
      type: 'fox_state_change',
      detail: `Fox moved from ${canon.foxStateStart} to ${canon.foxStateEnd}`,
      evidence: [
        `Fox state: ${canon.foxStateStart} → ${canon.foxStateEnd}`,
        `Sessions: ${canon.sessionCount}, hit rate: ${canon.hitRate}%`,
      ],
    };
  }

  // 2. New program
  if (canon.isNewProgram && canon.newWorkoutTitles.length > 0) {
    return {
      type: 'new_program',
      detail: `New workout${canon.newWorkoutTitles.length > 1 ? 's' : ''}: ${canon.newWorkoutTitles.join(', ')}`,
      evidence: [
        `New workouts this month: ${canon.newWorkoutTitles.join(', ')}`,
        `Total sessions on new program: ${canon.sessionCount}`,
      ],
    };
  }

  // 3. Comeback
  if (canon.isComeback) {
    return {
      type: 'comeback',
      detail: `Longest gap: ${canon.longestGapDays} days`,
      evidence: [
        `Longest gap: ${canon.longestGapDays} days`,
        `Came back with ${canon.sessionCount} sessions`,
        canon.avgDevotion !== null ? `Average devotion after return: ${canon.avgDevotion}` : '',
      ].filter(Boolean),
    };
  }

  // 4. Capacity shift or PR cluster
  if (canon.hasCapacityShift) {
    const prevVol = canon.previousMonth?.totalVolume ?? 0;
    const delta = prevVol > 0
      ? `+${Math.round(((canon.totalVolume - prevVol) / prevVol) * 100)}%`
      : 'N/A';
    return {
      type: 'capacity_shift',
      detail: `Volume increased ${delta} from previous month`,
      evidence: [
        `Total volume: ${canon.totalVolumeFormatted} (${delta} vs prev)`,
        `Sessions: ${canon.sessionCount}`,
      ],
    };
  }

  if (canon.hasPRCluster) {
    return {
      type: 'pr_cluster',
      detail: `${canon.prExercises.length} PRs this month: ${canon.prExercises.join(', ')}`,
      evidence: [
        `PRs: ${canon.prExercises.join(', ')}`,
        `Total PR count: ${canon.prExercises.length}`,
      ],
    };
  }

  return null;
}
