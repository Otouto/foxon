import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ExerciseListItem } from '@shared/types/exercise';

import { api } from './client';

interface ExerciseDetail {
  id: string;
  name: string;
  description: string | null;
  instructions: string | null;
  imageUrl: string | null;
  muscleGroup: { id: string; name: string } | null;
  equipment: { id: string; name: string } | null;
}

export function useExercises(query?: string) {
  return useQuery({
    queryKey: ['exercises', query ?? ''],
    queryFn: async () => {
      const path = query ? `/api/exercises?q=${encodeURIComponent(query)}` : '/api/exercises';
      const data = await api.get<{ exercises: ExerciseListItem[] }>(path);
      return data.exercises;
    },
  });
}

export function useExercise(id: string | undefined) {
  return useQuery({
    queryKey: ['exercise', id],
    queryFn: async () => {
      const data = await api.get<{ exercise: ExerciseDetail }>(`/api/exercises/${id}`);
      return data.exercise;
    },
    enabled: !!id,
  });
}

export function useMuscleGroups() {
  return useQuery({
    queryKey: ['muscle-groups'],
    queryFn: async () => {
      const data = await api.get<{ muscleGroups: { id: string; name: string }[] }>(
        '/api/muscle-groups'
      );
      return data.muscleGroups;
    },
    staleTime: Infinity,
  });
}

export function useEquipment() {
  return useQuery({
    queryKey: ['equipment'],
    queryFn: async () => {
      const data = await api.get<{ equipment: { id: string; name: string }[] }>('/api/equipment');
      return data.equipment;
    },
    staleTime: Infinity,
  });
}

export interface ExercisePayload {
  name: string;
  muscleGroupId?: string;
  equipmentId?: string;
  instructions?: string;
  imageUrl?: string;
}

export function useCreateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ExercisePayload) =>
      api.post<{ exercise: ExerciseDetail }>('/api/exercises', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exercises'] }),
  });
}

export function useUpdateExercise(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ExercisePayload>) =>
      api.put<{ exercise: ExerciseDetail }>(`/api/exercises/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      queryClient.invalidateQueries({ queryKey: ['exercise', id] });
    },
  });
}
