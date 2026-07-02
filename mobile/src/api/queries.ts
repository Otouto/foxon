import { queryOptions, useQuery } from '@tanstack/react-query';
import type { WorkoutDetails, WorkoutListItem } from '@shared/types/workout';

import { api } from './client';
import type { DashboardData } from './types';

export const dashboardQueryOptions = () =>
  queryOptions({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardData>('/api/dashboard'),
  });

export function useDashboard() {
  return useQuery(dashboardQueryOptions());
}

export const workoutsQueryOptions = () =>
  queryOptions({
    queryKey: ['workouts'],
    queryFn: async () => {
      const data = await api.get<{ success: boolean; workouts: WorkoutListItem[] }>('/api/workouts');
      return data.workouts;
    },
  });

export function useWorkouts() {
  return useQuery(workoutsQueryOptions());
}

export const workoutQueryOptions = (id: string | undefined) =>
  queryOptions({
    queryKey: ['workout', id],
    queryFn: () => api.get<WorkoutDetails>(`/api/workouts/${id}`),
    enabled: !!id,
  });

export function useWorkout(id: string | undefined) {
  return useQuery(workoutQueryOptions(id));
}

export interface WorkoutPreloadData {
  workout: WorkoutDetails;
  previousSessionData: Record<string, { load: number; reps: number }[]>;
  lastSessionDate: string | null;
}

export const workoutPreloadQueryOptions = (id: string | undefined) =>
  queryOptions({
    queryKey: ['workout-preload', id],
    queryFn: async () => {
      const data = await api.get<{ preloadedData: WorkoutPreloadData }>(
        `/api/workouts/${id}/preload`
      );
      return data.preloadedData;
    },
    enabled: !!id,
  });
