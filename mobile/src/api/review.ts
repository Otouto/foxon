import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from './client';
import type { SessionReviewData } from './types';

/**
 * Mirrors src/services/ExerciseAnalyticsService.ts shapes (service imports Prisma,
 * so the types are mirrored here). Keep in sync with the web app.
 */
export interface ExerciseAnalytics {
  id: string;
  name: string;
  muscleGroup: string | null;
  peakPerformance: {
    weight: number;
    reps: number;
    isBodyweight: boolean;
  } | null;
  devotionDots: boolean[];
  actualWeeksTracked: number;
  consistency: number;
  chips: ('foundation' | 'missing')[];
}

export interface CategorizedExerciseAnalytics {
  activeExercises: ExerciseAnalytics[];
  archivedExercises: ExerciseAnalytics[];
}

export function useSessionsReview() {
  return useQuery({
    queryKey: ['review', 'sessions'],
    queryFn: () =>
      api.get<{ sessions: SessionReviewData[]; weeklyGoal: number }>(
        '/api/sessions/review?tab=sessions'
      ),
  });
}

export function useExercisesReview() {
  return useQuery({
    queryKey: ['review', 'exercises'],
    queryFn: () => api.get<CategorizedExerciseAnalytics>('/api/sessions/review?tab=exercises'),
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => api.delete(`/api/sessions/${sessionId}/delete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review', 'sessions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
