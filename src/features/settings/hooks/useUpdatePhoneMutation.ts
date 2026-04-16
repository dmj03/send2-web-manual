'use client';

import { useMutation } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { settingsEndpoints } from '@/lib/api/endpoints';
import type { ApiResponse } from '@/types/api';
import type { UpdatePhonePayload } from '@/types/settings';

interface UpdatePhoneResponse {
  verificationRequired: boolean;
  message: string;
}

export function useUpdatePhoneMutation() {
  return useMutation<UpdatePhoneResponse, ApiClientError, UpdatePhonePayload>({
    mutationFn: async (payload) => {
      const res = await apiClient.post<ApiResponse<UpdatePhoneResponse>>(
        settingsEndpoints.updatePhone,
        payload,
      );
      return res.data;
    },
  });
}
