import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from './client';
import type { ChronicleListItem, ProfileData } from './types';

export const profileQueryOptions = () =>
  queryOptions({
    queryKey: ['profile'],
    queryFn: () => api.get<ProfileData>('/api/profile'),
  });

export function useProfile() {
  return useQuery(profileQueryOptions());
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: { weeklyGoal?: number; email?: string | null }) =>
      api.patch<{ success: boolean; weeklyGoal: number; email: string | null }>(
        '/api/profile',
        updates
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export const chroniclesQueryOptions = () =>
  queryOptions({
    queryKey: ['chronicles'],
    queryFn: () => api.get<ChronicleListItem[]>('/api/chronicle'),
  });

export function useChronicles() {
  return useQuery(chroniclesQueryOptions());
}

export const chronicleQueryOptions = (id: string | undefined) =>
  queryOptions({
    queryKey: ['chronicle', id],
    queryFn: () => api.get<ChronicleListItem>(`/api/chronicle/${id}`),
    enabled: !!id,
  });

export function useChronicle(id: string | undefined) {
  return useQuery(chronicleQueryOptions(id));
}
