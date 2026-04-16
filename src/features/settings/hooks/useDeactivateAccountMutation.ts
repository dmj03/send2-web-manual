'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { settingsEndpoints } from '@/lib/api/endpoints';
import { useAuthStore } from '@/stores/authStore';
import type { DeactivateAccountPayload } from '@/types/settings';

export function useDeactivateAccountMutation() {
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  return useMutation<void, ApiClientError, DeactivateAccountPayload>({
    mutationFn: async (payload) => {
      await apiClient.post<void>(settingsEndpoints.deactivateAccount, payload);
    },
    onSuccess: () => {
      // Clear all cached data and auth state then redirect to home
      queryClient.clear();
      logout();
      router.replace('/');
    },
  });
}
