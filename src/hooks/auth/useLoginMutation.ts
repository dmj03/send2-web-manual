'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { authEndpoints } from '@/lib/api/endpoints';
import { useAuthStore } from '@/stores/authStore';
import type { ApiResponse } from '@/types/api';
import type { LoginCredentials } from '@/types/auth';
import type { AuthUser } from '@/stores/authStore';

interface LoginResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const { login } = useAuthStore();

  return useMutation<LoginResponse, ApiClientError, LoginCredentials>({
    mutationFn: async (credentials) => {
      const res = await apiClient.post<ApiResponse<LoginResponse>>(
        authEndpoints.login,
        credentials,
      );
      return res.data;
    },
    onSuccess: (data) => {
      login(data.user, data.token, data.refreshToken);
      // Seed profile cache immediately so useProfileQuery doesn't flash loading
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
