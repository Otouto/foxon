import type { ChronicleDataPayload } from '@/lib/types/chronicle';
import type { Canon, CanonSession, FoxState } from './types';

/**
 * buildCanon — normalizes raw ChronicleDataPayload into a clean Canon.
 * Pure function: reshapes data, computes flags, strips noise.
 */
export function buildCanon(data: ChronicleDataPayload): Canon {
  const sessions: CanonSession[] = data.sessions.map(s => ({
    id: s.id,
    date: s.date,
    dayOfWeek: s.dayOfWeek,
    timeOfDay: s.timeOfDay,
    workoutTitle: s.workoutTitle,
    devotionScore: s.devotionScore,
    devotionGrade: s.devotionGrade,
    pillars: s.pillars,
    effort: s.effort,
    vibeLine: s.vibeLine,
    note: s.note,
    duration: s.duration,
    restDaysBefore: s.restDaysBefore,
    isComeback: s.isComeback,
    weekNumber: s.weekNumber,
    sessionVolume: s.sessionVolume,
    heaviestLift: s.heaviestLift,
  }));

  const longestGapDays = Math.max(0, ...data.sessions.map(s => s.restDaysBefore ?? 0));
  const isComeback = longestGapDays >= 10;
  const hasPR = data.exercises.some(e => e.isPR);
  const prExercises = data.exercises.filter(e => e.isPR).map(e => e.name);

  // Score variance
  const scores = data.sessions
    .map(s => s.devotionScore)
    .filter((s): s is number => s !== null);
  let scoreVariance: number | null = null;
  if (scores.length >= 2) {
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    scoreVariance = Math.round(
      scores.reduce((sum, s) => sum + (s - mean) ** 2, 0) / scores.length
    );
  }

  // Capacity shift: volume up 20%+ from previous month
  const hasCapacityShift = data.previousMonth !== null &&
    data.previousMonth.totalVolume > 0 &&
    data.currentMonth.totalVolume > data.previousMonth.totalVolume * 1.2;

  // PR cluster: 3+ PRs
  const hasPRCluster = prExercises.length >= 3;

  return {
    sessions,
    sessionCount: data.currentMonth.sessionCount,
    weeklyGoal: data.currentMonth.weeklyGoal,
    monthlyTarget: data.currentMonth.weeklyGoal * data.weeks.length,
    hitRate: data.currentMonth.weeklyGoal * data.weeks.length > 0
      ? Math.round((data.currentMonth.sessionCount / (data.currentMonth.weeklyGoal * data.weeks.length)) * 100)
      : 0,
    avgDevotion: data.currentMonth.avgDevotion,
    bestScore: data.currentMonth.bestScore,
    worstScore: data.currentMonth.worstScore,
    scoreVariance,
    foxStateStart: data.currentMonth.foxStateStart as FoxState,
    foxStateEnd: data.currentMonth.foxStateEnd as FoxState,
    foxLeveledUp: data.currentMonth.foxLeveledUp,
    isNewProgram: data.currentMonth.isNewProgram,
    newWorkoutTitles: data.currentMonth.newWorkoutTitles,
    isComeback,
    longestGapDays,
    hasPR,
    prExercises,
    totalVolume: data.currentMonth.totalVolume,
    totalVolumeFormatted: data.currentMonth.totalVolumeFormatted,
    weeks: data.weeks,
    pillars: data.pillars,
    exercises: data.exercises,
    rhythm: data.rhythm,
    milestones: data.milestones,
    previousMonth: data.previousMonth,
    timeFrame: data.timeFrame,
    userName: data.userName,
    hasCapacityShift,
    hasPRCluster,
    dominantTimeOfDay: data.rhythm.dominantTimeOfDay,
    dominantDays: data.rhythm.dominantDays,
  };
}
