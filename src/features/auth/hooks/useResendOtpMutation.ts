'use client';

import { useMutation } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { authEndpoints } from '@/lib/api/endpoints';
import type { ApiResponse } from '@/types/api';

interface ResendOtpPayload {
  email: string;
}

interface ResendOtpResponse {
  message: string;
}

export function useResendOtpMutation() {
  return useMutation<ResendOtpResponse, ApiClientError, ResendOtpPayload>({
    mutationFn: async (payload) => {
      const res = await apiClient.post<ApiResponse<ResendOtpResponse>>(
        authEndpoints.resendOtp,
        payload,
      );
      return res.data;
    },
  });
}
