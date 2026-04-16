'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { settingsEndpoints } from '@/lib/api/endpoints';
import { settingsQueryKeys } from './settingsQueryKeys';
import type { ActiveSession } from '@/types/settings';

export function useRevokeSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiClientError, string>({
    mutationFn: async (sessionId) => {
      await apiClient.delete<void>(settingsEndpoints.revokeSession(sessionId));
    },
    onMutate: async (sessionId) => {
      await queryClient.cancelQueries({ queryKey: settingsQueryKeys.sessions() });
      const previous = queryClient.getQueryData<ActiveSession[]>(
        settingsQueryKeys.sessions(),
      );
      // Optimistically remove the revoked session
      queryClient.setQueryData<ActiveSession[]>(
        settingsQueryKeys.sessions(),
        (old) => old?.filter((s) => s.id !== sessionId) ?? [],
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      const ctx = context as { previous?: ActiveSession[] } | undefined;
      if (ctx?.previous) {
        queryClient.setQueryData(settingsQueryKeys.sessions(), ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: settingsQueryKeys.sessions() });
    },
  });
}

export function useRevokeAllSessionsMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiClientError, void>({
    mutationFn: async () => {
      await apiClient.delete<void>(settingsEndpoints.revokeAllSessions);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsQueryKeys.sessions() });
    },
  });
}
