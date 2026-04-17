'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { authEndpoints } from '@/lib/api/endpoints';
import { useAuthStore } from '@/stores/authStore';

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();

  return useMutation<void, ApiClientError, void>({
    mutationFn: async () => {
      // Best-effort server-side logout — if the token is already expired the
      // call will fail; we still clear local state regardless.
      try {
        await apiClient.post<void>(authEndpoints.logout);
      } catch {
        // Intentionally swallow — local logout must always succeed
      }
    },
    onSettled: () => {
      logout();
      // Wipe every cached query so no stale user-scoped data leaks after logout
      queryClient.clear();
    },
  });
}
