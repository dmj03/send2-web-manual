'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { rateAlertEndpoints } from '@/lib/api/endpoints';
import { rateAlertQueryKeys } from './rateAlertQueryKeys';
import type { RateAlert } from '@/types/rate-alert';

export function useDeleteRateAlertMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiClientError, string>({
    mutationFn: async (id) => {
      await apiClient.delete<void>(rateAlertEndpoints.delete(id));
    },
    onMutate: async (deletedId) => {
      // Cancel in-flight fetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: rateAlertQueryKeys.lists() });

      const previous = queryClient.getQueryData<RateAlert[]>(
        rateAlertQueryKeys.lists(),
      );

      // Optimistically remove the alert from the list
      queryClient.setQueryData<RateAlert[]>(rateAlertQueryKeys.lists(), (old) =>
        old ? old.filter((a) => a.id !== deletedId) : [],
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      // Roll back on failure
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
