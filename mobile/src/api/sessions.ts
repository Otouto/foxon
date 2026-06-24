import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from './client';

/**
 * Mirrors SessionWithDetails from src/services/SessionService.ts and the
 * exercise history entries from ExerciseAnalyticsService.getExerciseHistory.
 * Keep in sync with the web app.
 */
export interface SessionSetDetail {
  id: string;
  type: 'WARMUP' | 'NORMAL';
  load: number;
  reps: number;
  completed: boolean;
  order: number;
  notes: string | null;
}

/** Devotion pillar scores (0–1). Mirrors DevotionPillars in SessionService.ts. */
export interface DevotionPillars {
  EC: number; // Exercise Coverage
  SC: number; // Set Completion
  RF: number; // Rep Fidelity
  LF?: number; // Load Fidelity (absent for bodyweight-only sessions)
}

/** Top deviation explaining the score. Mirrors DevotionDeviation in SessionService.ts. */
export interface DevotionDeviation {
  type: 'missed_sets' | 'rep_variance' | 'load_variance' | 'missed_exercise';
  exerciseName: string;
  description: string;
  impact: number; // 0–1 share of the gap
}

export interface SessionWithDetails {
  id: string;
  workoutId: string | null;
  date: string;
  status: string;
  duration: number | null;
  devotionScore: number | null;
  devotionGrade: string | null;
  devotionPillars?: DevotionPillars | null;
  devotionDeviations?: DevotionDeviation[] | null;
  sessionSeal?: {
    effort: string;
    vibeLine: string;
    note: string | null;
  } | null;
  sessionPhoto?: {
    imageUrl: string;
  } | null;
  sessionExercises: {
    id: string;
    exerciseId: string;
    order: number;
    notes: string | null;
    exercise: { id: string; name: string };
    sessionSets: SessionSetDetail[];
  }[];
  workout?: { id: string; title: string } | null;
}

export interface ExerciseHistoryEntry {
  id: string;
  date: string;
  workoutTitle: string | null;
  duration: number | null;
  devotionScore: number | null;
  sessionExercise: {
    id: string;
    order: number;
    notes: string | null;
    exercise: {
      name: string;
      muscleGroup: { name: string } | null;
      equipment: { name: string } | null;
    };
    sessionSets: SessionSetDetail[];
  };
}

export const sessionDetailsQueryOptions = (id: string | undefined) =>
  queryOptions({
    queryKey: ['session', id],
    queryFn: () => api.get<SessionWithDetails>(`/api/sessions/${id}`),
    enabled: !!id,
  });

export function useSessionDetails(id: string | undefined) {
  return useQuery(sessionDetailsQueryOptions(id));
}

export const exerciseHistoryQueryOptions = (exerciseId: string | undefined) =>
  queryOptions({
    queryKey: ['exercise-history', exerciseId],
    queryFn: async () => {
      const data = await api.get<{ history: ExerciseHistoryEntry[] }>(
        `/api/exercises/${exerciseId}/history`
      );
      return data.history;
    },
    enabled: !!exerciseId,
  });

export function useExerciseHistory(exerciseId: string | undefined) {
  return useQuery(exerciseHistoryQueryOptions(exerciseId));
}
