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

function setAuthCookie(token: string) {
  const maxAge = 60 * 60 * 24 * 7; // 7 days
  document.cookie = `auth_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `profile_complete=true; path=/; max-age=${maxAge}; SameSite=Lax`;
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
      setAuthCookie(data.token);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
