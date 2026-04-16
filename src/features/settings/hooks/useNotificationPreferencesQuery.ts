'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { settingsEndpoints } from '@/lib/api/endpoints';
import { settingsQueryKeys } from './settingsQueryKeys';
import type { ApiResponse } from '@/types/api';
import type { NotificationPreferences } from '@/types/settings';

export function useNotificationPreferencesQuery() {
  return useQuery<NotificationPreferences, ApiClientError>({
    queryKey: settingsQueryKeys.notificationPreferences(),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<ApiResponse<NotificationPreferences>>(
        settingsEndpoints.notificationPreferences,
        { signal },
      );
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
