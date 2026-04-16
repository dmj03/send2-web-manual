'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { settingsEndpoints } from '@/lib/api/endpoints';
import { settingsQueryKeys } from './settingsQueryKeys';
import type { ApiResponse } from '@/types/api';
import type { PrivacyPreferences } from '@/types/settings';

export function usePrivacyQuery() {
  return useQuery<PrivacyPreferences, ApiClientError>({
    queryKey: settingsQueryKeys.privacy(),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<ApiResponse<PrivacyPreferences>>(
        settingsEndpoints.privacy,
        { signal },
      );
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
