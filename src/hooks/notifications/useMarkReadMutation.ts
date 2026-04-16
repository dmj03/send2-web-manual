'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { notificationEndpoints } from '@/lib/api/endpoints';
import { notificationQueryKeys } from './notificationQueryKeys';

export function useMarkReadMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiClientError, string>({
    mutationFn: async (notificationId) => {
      await apiClient.patch<void>(notificationEndpoints.markRead(notificationId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
    },
  });
}