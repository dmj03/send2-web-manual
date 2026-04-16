'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { settingsEndpoints } from '@/lib/api/endpoints';
import { settingsQueryKeys } from './settingsQueryKeys';
import type { ApiResponse } from '@/types/api';
import type { PrivacyPreferences, UpdatePrivacyPayload } from '@/types/settings';

export function useUpdatePrivacyMutation() {
  const queryClient = useQueryClient();

  return useMutation<PrivacyPreferences, ApiClientError, UpdatePrivacyPayload>({
    mutationFn: async (payload) => {
      const res = await apiClient.patch<ApiResponse<PrivacyPreferences>>(
        settingsEndpoints.privacy,
        payload,
      );
      return res.data;
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: settingsQueryKeys.privacy() });
      const previous = queryClient.getQueryData<PrivacyPreferences>(
        settingsQueryKeys.privacy(),
      );
      queryClient.setQueryData<PrivacyPreferences>(
        settingsQueryKeys.privacy(),
        (old) => (old ? { ...old, ...payload } : old),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      const ctx = context as { previous?: PrivacyPreferences } | undefined;
      if (ctx?.previous) {
        queryClient.setQueryData(settingsQueryKeys.privacy(), ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: settingsQueryKeys.privacy() });
    },
  });
}
