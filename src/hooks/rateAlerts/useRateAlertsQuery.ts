'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { rateAlertEndpoints } from '@/lib/api/endpoints';
import { rateAlertQueryKeys } from './rateAlertQueryKeys';
import { useAuthStore } from '@/stores/authStore';
import type { ApiResponse } from '@/types/api';
import type { RateAlert } from '@/types/rate-alert';

export function useRateAlertsQuery() {
  const isAuthenticated = useAuthStore((s) => s.token !== null);

  return useQuery<RateAlert[], ApiClientError>({
    queryKey: rateAlertQueryKeys.lists(),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<ApiResponse<RateAlert[]>>(
        rateAlertEndpoints.list,
        { signal },
      );
      return res.data;
    },
    enabled: isAuthenticated,
  });
}
