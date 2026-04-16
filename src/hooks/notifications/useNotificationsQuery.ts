'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { notificationEndpoints } from '@/lib/api/endpoints';
import { notificationQueryKeys } from './notificationQueryKeys';
import type { ApiResponse } from '@/types/api';
import type { AppNotification } from '@/types/notification';

export function useNotificationsQuery(enabled = true) {
  return useQuery<AppNotification[], ApiClientError>({
    queryKey: notificationQueryKeys.lists(),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<ApiResponse<AppNotification[]>>(
        notificationEndpoints.list,
        { signal },
      );
      return res.data;
    },
    enabled,
    staleTime: 30_000,
  });
}
