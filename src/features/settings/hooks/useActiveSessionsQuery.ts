'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { settingsEndpoints } from '@/lib/api/endpoints';
import { settingsQueryKeys } from './settingsQueryKeys';
import type { ApiResponse } from '@/types/api';
import type { ActiveSession } from '@/types/settings';

export function useActiveSessionsQuery() {
  return useQuery<ActiveSession[], ApiClientError>({
    queryKey: settingsQueryKeys.sessions(),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<ApiResponse<ActiveSession[]>>(
        settingsEndpoints.sessions,
        { signal },
      );
      return res.data;
    },
    staleTime: 60 * 1000,
  });
}
