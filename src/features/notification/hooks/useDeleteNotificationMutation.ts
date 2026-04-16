'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { notificationEndpoints } from '@/lib/api/endpoints';
import { notificationQueryKeys } from '@/hooks/notifications/notificationQueryKeys';
import type { AppNotification } from '@/types/notification';

export function useDeleteNotificationMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiClientError, string>({
    mutationFn: async (id) => {
      await apiClient.delete<void>(notificationEndpoints.delete(id));
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notificationQueryKeys.lists() });

      const previous = queryClient.getQueryData<AppNotification[]>(
        notificationQueryKeys.lists(),
      );

      // Optimistically remove
      queryClient.setQueryData<AppNotification[]>(
        notificationQueryKeys.lists(),
        (old) => (old ? old.filter((n) => n.id !== id) : []),
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      const ctx = context as { previous?: AppNotification[] } | undefined;
      if (ctx?.previous) {
        queryClient.setQueryData(notificationQueryKeys.lists(), ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.lists() });
    },
  });
}
