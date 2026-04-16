'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { settingsEndpoints } from '@/lib/api/endpoints';
import { settingsQueryKeys } from './settingsQueryKeys';
import type { ApiResponse } from '@/types/api';
import type { TwoFactorStatus } from '@/types/settings';

export function useTwoFactorQuery() {
  return useQuery<TwoFactorStatus, ApiClientError>({
    queryKey: settingsQueryKeys.twoFactorStatus(),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<ApiResponse<TwoFactorStatus>>(
        settingsEndpoints.twoFactorStatus,
        { signal },
      );
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}
