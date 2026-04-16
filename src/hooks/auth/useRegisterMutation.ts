'use client';

import { useMutation } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { authEndpoints } from '@/lib/api/endpoints';
import type { ApiResponse } from '@/types/api';
import type { RegisterPayload } from '@/types/auth';

interface RegisterResponse {
  /** The e-mail address that the OTP was sent to. */
  email: string;
  /** True when the backend dispatched a verification e-mail. */
  verificationSent: boolean;
}

export function useRegisterMutation() {
  return useMutation<RegisterResponse, ApiClientError, RegisterPayload>({
    mutationFn: async (payload) => {
      const res = await apiClient.post<ApiResponse<RegisterResponse>>(
        authEndpoints.register,
        payload,
      );
      return res.data;
    },
  });
}
