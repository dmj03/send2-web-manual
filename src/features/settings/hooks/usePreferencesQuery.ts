'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { settingsEndpoints } from '@/lib/api/endpoints';
import { settingsQueryKeys } from './settingsQueryKeys';
import type { ApiResponse } from '@/types/api';
import type { UserPreferences } from '@/types/settings';

export function usePreferencesQuery() {
  return useQuery<UserPreferences, ApiClientError>({
    queryKey: settingsQueryKeys.preferences(),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<ApiResponse<UserPreferences>>(
        settingsEndpoints.preferences,
        { signal },
      );
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
