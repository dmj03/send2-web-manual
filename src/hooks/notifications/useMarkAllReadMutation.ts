'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { notificationEndpoints } from '@/lib/api/endpoints';
import { notificationQueryKeys } from './notificationQueryKeys';

export function useMarkAllReadMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiClientError, void>({
    mutationFn: async () => {
      await apiClient.patch<void>(notificationEndpoints.markAllRead);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
    },
  });
}