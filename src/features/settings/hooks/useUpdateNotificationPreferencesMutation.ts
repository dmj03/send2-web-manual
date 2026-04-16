'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { settingsEndpoints } from '@/lib/api/endpoints';
import { settingsQueryKeys } from './settingsQueryKeys';
import type { ApiResponse } from '@/types/api';
import type {
  NotificationPreferences,
  UpdateNotificationPreferencesPayload,
} from '@/types/settings';

export function useUpdateNotificationPreferencesMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    NotificationPreferences,
    ApiClientError,
    UpdateNotificationPreferencesPayload
  >({
    mutationFn: async (payload) => {
      const res = await apiClient.patch<ApiResponse<NotificationPreferences>>(
        settingsEndpoints.notificationPreferences,
        payload,
      );
      return res.data;
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({
        queryKey: settingsQueryKeys.notificationPreferences(),
      });
      const previous = queryClient.getQueryData<NotificationPreferences>(
        settingsQueryKeys.notificationPreferences(),
      );
      queryClient.setQueryData<NotificationPreferences>(
        settingsQueryKeys.notificationPreferences(),
        (old) => {
          if (!old) return old;
          const next = { ...old };
          for (const key of Object.keys(payload) as Array<
            keyof NotificationPreferences
          >) {
            if (payload[key]) {
              next[key] = { ...old[key], ...payload[key] };
            }
          }
          return next;
        },
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      const ctx = context as
        | { previous?: NotificationPreferences }
        | undefined;
      if (ctx?.previous) {
        queryClient.setQueryData(
          settingsQueryKeys.notificationPreferences(),
          ctx.previous,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: settingsQueryKeys.notificationPreferences(),
      });
    },
  });
}
