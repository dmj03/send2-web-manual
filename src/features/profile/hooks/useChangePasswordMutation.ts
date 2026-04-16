'use client';

import { useMutation } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { profileEndpoints } from '@/lib/api/endpoints';
import type { ApiResponse } from '@/types/api';

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ChangePasswordResponse {
  message: string;
}

export function useChangePasswordMutation() {
  return useMutation<ChangePasswordResponse, ApiClientError, ChangePasswordPayload>({
    mutationFn: async (payload) => {
      const res = await apiClient.post<ApiResponse<ChangePasswordResponse>>(
        profileEndpoints.changePassword,
        {
          currentPassword: payload.currentPassword,
          newPassword: payload.newPassword,
        },
      );
      return res.data;
    },
  });
}
