'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { authEndpoints } from '@/lib/api/endpoints';
import { useAuthStore } from '@/stores/authStore';

function clearAuthCookies() {
  document.cookie = 'auth_token=; path=/; max-age=0; SameSite=Lax';
  document.cookie = 'profile_complete=; path=/; max-age=0; SameSite=Lax';
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();

  return useMutation<void, ApiClientError, void>({
    mutationFn: async () => {
      try {
        await apiClient.post<void>(authEndpoints.logout);
      } catch {
        // Intentionally swallow — local logout must always succeed
      }
    },
    onSettled: () => {
      clearAuthCookies();
      logout();
      queryClient.clear();
    },
  });
}
