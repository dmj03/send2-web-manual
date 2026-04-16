'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';
import type { ApiResponse } from '@/types/api';

export interface SearchHistoryEntry {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  sendAmount: number;
  receiveCountry: string;
  searchedAt: string;
}

const searchHistoryKeys = {
  all: ['search-history'] as const,
  list: () => [...searchHistoryKeys.all, 'list'] as const,
} as const;

export function useSearchHistoryQuery() {
  const isAuthenticated = useAuthStore((s) => s.token !== null);

  return useQuery<SearchHistoryEntry[], ApiClientError>({
    queryKey: searchHistoryKeys.list(),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<ApiResponse<SearchHistoryEntry[]>>(
        '/profile/search-history',
        { signal },
      );
      return res.data;
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useDeleteSearchHistoryMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiClientError, string>({
    mutationFn: async (entryId) => {
      await apiClient.delete<void>(`/profile/search-history/${entryId}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: searchHistoryKeys.list() });
    },
  });
}

export function useClearSearchHistoryMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiClientError, void>({
    mutationFn: async () => {
      await apiClient.delete<void>('/profile/search-history');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: searchHistoryKeys.list() });
    },
  });
}
