'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { rateAlertEndpoints } from '@/lib/api/endpoints';
import { rateAlertQueryKeys } from './rateAlertQueryKeys';
import type { ApiResponse } from '@/types/api';
import type { RateAlert, CreateRateAlertPayload } from '@/types/rate-alert';

export function useCreateRateAlertMutation() {
  const queryClient = useQueryClient();

  return useMutation<RateAlert, ApiClientError, CreateRateAlertPayload>({
    mutationFn: async (payload) => {
      const res = await apiClient.post<ApiResponse<RateAlert>>(
        rateAlertEndpoints.create,
        payload,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rateAlertQueryKeys.lists() });
    },
  });
}
