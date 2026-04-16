'use client';

import { useMutation } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { authEndpoints } from '@/lib/api/endpoints';
import type { ApiResponse } from '@/types/api';
import type { ResetPasswordPayload } from '@/types/auth';

interface ResetPasswordResponse {
  message: string;
}

export function useResetPasswordMutation() {
  return useMutation<ResetPasswordResponse, ApiClientError, ResetPasswordPayload>({
    mutationFn: async (payload) => {
      const res = await apiClient.post<ApiResponse<ResetPasswordResponse>>(
        authEndpoints.resetPassword,
        payload,
      );
      return res.data;
    },
  });
}
