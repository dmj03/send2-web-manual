'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { rateAlertEndpoints } from '@/lib/api/endpoints';
import { rateAlertQueryKeys } from '@/hooks/rateAlerts/rateAlertQueryKeys';
import type { RateAlert } from '@/types/rate-alert';
import type { ApiResponse } from '@/types/api';

interface TogglePayload {
  id: string;
  isActive: boolean;
}

export function useToggleRateAlertMutation() {
  const queryClient = useQueryClient();

  return useMutation<RateAlert, ApiClientError, TogglePayload>({
    mutationFn: async ({ id }) => {
      const res = await apiClient.patch<ApiResponse<RateAlert>>(
        rateAlertEndpoints.toggle(id),
      );
      return res.data;
    },
    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries({ queryKey: rateAlertQueryKeys.lists() });

      const previous = queryClient.getQueryData<RateAlert[]>(
        rateAlertQueryKeys.lists(),
      );

      // Optimistic update
      queryClient.setQueryData<RateAlert[]>(rateAlertQueryKeys.lists(), (old) =>
        old
          ? old.map((a) => (a.id === id ? { ...a, isActive } : a))
          : [],
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      const ctx = context as { previous?: RateAlert[] } | undefined;
      if (ctx?.previous) {
        queryClient.setQueryData(rateAlertQueryKeys.lists(), ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: rateAlertQueryKeys.lists() });
    },
  });
}
