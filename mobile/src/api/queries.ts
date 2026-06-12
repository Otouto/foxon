import { useQuery } from '@tanstack/react-query';
import type { WorkoutDetails, WorkoutListItem } from '@shared/types/workout';

import { api } from './client';
import type { DashboardData } from './types';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardData>('/api/dashboard'),
  });
}

export function useWorkouts() {
  return useQuery({
    queryKey: ['workouts'],
    queryFn: async () => {
      const data = await api.get<{ success: boolean; workouts: WorkoutListItem[] }>('/api/workouts');
      return data.workouts;
    },
  });
}

export function useWorkout(id: string | undefined) {
  return useQuery({
    queryKey: ['workout', id],
    queryFn: () => api.get<WorkoutDetails>(`/api/workouts/${id}`),
    enabled: !!id,
  });
}
