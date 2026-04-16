'use client';

import { useMutation } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { authEndpoints } from '@/lib/api/endpoints';
import type { ApiResponse } from '@/types/api';
import type { ForgotPasswordPayload } from '@/types/auth';

interface ForgotPasswordResponse {
  /** Confirmation message safe to show the user. */
  message: string;
}

export function useForgotPasswordMutation() {
  return useMutation<ForgotPasswordResponse, ApiClientError, ForgotPasswordPayload>({
    mutationFn: async (payload) => {
      const res = await apiClient.post<ApiResponse<ForgotPasswordResponse>>(
        authEndpoints.forgotPassword,
        payload,
      );
      return res.data;
    },
  });
}
