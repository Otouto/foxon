import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from './client';
import type { ChronicleListItem, ProfileData } from './types';

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get<ProfileData>('/api/profile'),
  });
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

export function useChronicles() {
  return useQuery({
    queryKey: ['chronicles'],
    queryFn: () => api.get<ChronicleListItem[]>('/api/chronicle'),
  });
}

export function useChronicle(id: string | undefined) {
  return useQuery({
    queryKey: ['chronicle', id],
    queryFn: () => api.get<ChronicleListItem>(`/api/chronicle/${id}`),
    enabled: !!id,
  });
}
