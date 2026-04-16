'use client';

import { useMutation } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { settingsEndpoints } from '@/lib/api/endpoints';
import type { ApiResponse } from '@/types/api';
import type { UpdateEmailPayload } from '@/types/settings';

interface UpdateEmailResponse {
  /** True when the OTP verification step is required before the change takes effect. */
  verificationRequired: boolean;
  message: string;
}

export function useUpdateEmailMutation() {
  return useMutation<UpdateEmailResponse, ApiClientError, UpdateEmailPayload>({
    mutationFn: async (payload) => {
      const res = await apiClient.post<ApiResponse<UpdateEmailResponse>>(
        settingsEndpoints.updateEmail,
        payload,
      );
      return res.data;
    },
  });
}
