'use client';

import { useMutation } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { authEndpoints } from '@/lib/api/endpoints';
import { useAuthStore } from '@/stores/authStore';
import type { ApiResponse } from '@/types/api';
import type { VerifyOtpPayload } from '@/types/auth';
import type { AuthUser } from '@/stores/authStore';

interface OtpVerifyResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
}

export function useOtpVerifyMutation() {
  const { login } = useAuthStore();

  return useMutation<OtpVerifyResponse, ApiClientError, VerifyOtpPayload>({
    mutationFn: async (payload) => {
      const res = await apiClient.post<ApiResponse<OtpVerifyResponse>>(
        authEndpoints.verifyOtp,
        payload,
      );
      return res.data;
    },
    onSuccess: (data) => {
      login(data.user, data.token, data.refreshToken);
    },
  });
}
