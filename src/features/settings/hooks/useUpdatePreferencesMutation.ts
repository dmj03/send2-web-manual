'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { settingsEndpoints } from '@/lib/api/endpoints';
import { settingsQueryKeys } from './settingsQueryKeys';
import type { ApiResponse } from '@/types/api';
import type { UserPreferences, UpdatePreferencesPayload } from '@/types/settings';

export function useUpdatePreferencesMutation() {
  const queryClient = useQueryClient();

  return useMutation<UserPreferences, ApiClientError, UpdatePreferencesPayload>({
    mutationFn: async (payload) => {
      const res = await apiClient.patch<ApiResponse<UserPreferences>>(
        settingsEndpoints.preferences,
        payload,
      );
      return res.data;
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: settingsQueryKeys.preferences() });
      const previous = queryClient.getQueryData<UserPreferences>(
        settingsQueryKeys.preferences(),
      );
      queryClient.setQueryData<UserPreferences>(
        settingsQueryKeys.preferences(),
        (old) => (old ? { ...old, ...payload } : old),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      const ctx = context as { previous?: UserPreferences } | undefined;
      if (ctx?.previous) {
        queryClient.setQueryData(settingsQueryKeys.preferences(), ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: settingsQueryKeys.preferences() });
    },
  });
}
