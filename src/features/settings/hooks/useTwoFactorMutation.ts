'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { settingsEndpoints } from '@/lib/api/endpoints';
import { settingsQueryKeys } from './settingsQueryKeys';
import type { ApiResponse } from '@/types/api';
import type {
  TwoFactorStatus,
  EnableTwoFactorPayload,
  DisableTwoFactorPayload,
} from '@/types/settings';

/** Initiates 2FA setup — returns an otpAuthUrl for QR display and backup codes. */
export function useTwoFactorSetupMutation() {
  const queryClient = useQueryClient();

  return useMutation<TwoFactorStatus, ApiClientError, void>({
    mutationFn: async () => {
      const res = await apiClient.post<ApiResponse<TwoFactorStatus>>(
        settingsEndpoints.twoFactorSetup,
      );
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(settingsQueryKeys.twoFactorStatus(), data);
    },
  });
}

/** Confirms the TOTP code and activates 2FA. */
export function useTwoFactorEnableMutation() {
  const queryClient = useQueryClient();

  return useMutation<TwoFactorStatus, ApiClientError, EnableTwoFactorPayload>({
    mutationFn: async (payload) => {
      const res = await apiClient.post<ApiResponse<TwoFactorStatus>>(
        settingsEndpoints.twoFactorEnable,
        payload,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsQueryKeys.twoFactorStatus() });
    },
  });
}

/** Disables 2FA after re-authentication. */
export function useTwoFactorDisableMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiClientError, DisableTwoFactorPayload>({
    mutationFn: async (payload) => {
      await apiClient.delete<void>(
        settingsEndpoints.twoFactorDisable,
        { headers: { 'X-Confirm-Password': payload.currentPassword } },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsQueryKeys.twoFactorStatus() });
    },
  });
}
