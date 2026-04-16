'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { settingsEndpoints } from '@/lib/api/endpoints';
import { settingsQueryKeys } from './useSettingsQueries';
import type { ApiResponse } from '@/types/api';
import type {
  UpdatePreferencesPayload,
  UpdateNotificationPreferencesPayload,
  UpdatePrivacyPayload,
  EnableTwoFactorPayload,
  DisableTwoFactorPayload,
  TwoFactorStatus,
  UserPreferences,
  NotificationPreferences,
  PrivacyPreferences,
  DeactivateAccountPayload,
  UpdateEmailPayload,
  UpdatePhonePayload,
  VerifyChangeOtpPayload,
} from '@/types/settings';

// ---------------------------------------------------------------------------
// Preferences
// ---------------------------------------------------------------------------

export function useUpdatePreferencesMutation() {
  const qc = useQueryClient();
  return useMutation<UserPreferences, ApiClientError, UpdatePreferencesPayload>({
    mutationFn: async (payload) => {
      const res = await apiClient.patch<ApiResponse<UserPreferences>>(
        settingsEndpoints.preferences,
        payload,
      );
      return res.data;
    },
    onSuccess: (data) => {
      qc.setQueryData(settingsQueryKeys.preferences(), data);
    },
  });
}

// ---------------------------------------------------------------------------
// Notification preferences
// ---------------------------------------------------------------------------

export function useUpdateNotificationPreferencesMutation() {
  const qc = useQueryClient();
  return useMutation<
    NotificationPreferences,
    ApiClientError,
    UpdateNotificationPreferencesPayload
  >({
    mutationFn: async (payload) => {
      const res = await apiClient.patch<ApiResponse<NotificationPreferences>>(
        settingsEndpoints.notificationPreferences,
        payload,
      );
      return res.data;
    },
    onSuccess: (data) => {
      qc.setQueryData(settingsQueryKeys.notificationPreferences(), data);
    },
  });
}

// ---------------------------------------------------------------------------
// Privacy
// ---------------------------------------------------------------------------

export function useUpdatePrivacyMutation() {
  const qc = useQueryClient();
  return useMutation<PrivacyPreferences, ApiClientError, UpdatePrivacyPayload>({
    mutationFn: async (payload) => {
      const res = await apiClient.patch<ApiResponse<PrivacyPreferences>>(
        settingsEndpoints.privacy,
        payload,
      );
      return res.data;
    },
    onSuccess: (data) => {
      qc.setQueryData(settingsQueryKeys.privacy(), data);
    },
  });
}

// ---------------------------------------------------------------------------
// 2FA
// ---------------------------------------------------------------------------

export function useInitiateTwoFactorSetupMutation() {
  const qc = useQueryClient();
  return useMutation<TwoFactorStatus, ApiClientError, void>({
    mutationFn: async () => {
      const res = await apiClient.post<ApiResponse<TwoFactorStatus>>(
        settingsEndpoints.twoFactorSetup,
        {},
      );
      return res.data;
    },
    onSuccess: (data) => {
      qc.setQueryData(settingsQueryKeys.twoFactorStatus(), data);
    },
  });
}

export function useEnableTwoFactorMutation() {
  const qc = useQueryClient();
  return useMutation<TwoFactorStatus, ApiClientError, EnableTwoFactorPayload>({
    mutationFn: async (payload) => {
      const res = await apiClient.post<ApiResponse<TwoFactorStatus>>(
        settingsEndpoints.twoFactorEnable,
        payload,
      );
      return res.data;
    },
    onSuccess: (data) => {
      qc.setQueryData(settingsQueryKeys.twoFactorStatus(), data);
    },
  });
}

export function useDisableTwoFactorMutation() {
  const qc = useQueryClient();
  return useMutation<TwoFactorStatus, ApiClientError, DisableTwoFactorPayload>({
    mutationFn: async (payload) => {
      const res = await apiClient.delete<ApiResponse<TwoFactorStatus>>(
        settingsEndpoints.twoFactorDisable,
        { headers: {} },
      );
      void payload;
      return res.data;
    },
    onSuccess: (data) => {
      qc.setQueryData(settingsQueryKeys.twoFactorStatus(), data);
    },
  });
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export function useRevokeSessionMutation() {
  const qc = useQueryClient();
  return useMutation<void, ApiClientError, string>({
    mutationFn: async (sessionId) => {
      await apiClient.delete(settingsEndpoints.revokeSession(sessionId));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: settingsQueryKeys.sessions() });
    },
  });
}

export function useRevokeAllSessionsMutation() {
  const qc = useQueryClient();
  return useMutation<void, ApiClientError, void>({
    mutationFn: async () => {
      await apiClient.delete(settingsEndpoints.revokeAllSessions);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: settingsQueryKeys.sessions() });
    },
  });
}

// ---------------------------------------------------------------------------
// Account
// ---------------------------------------------------------------------------

export function useUpdateEmailMutation() {
  return useMutation<{ message: string }, ApiClientError, UpdateEmailPayload>({
    mutationFn: async (payload) => {
      const res = await apiClient.post<ApiResponse<{ message: string }>>(
        settingsEndpoints.updateEmail,
        payload,
      );
      return res.data;
    },
  });
}

export function useVerifyEmailChangeMutation() {
  return useMutation<{ message: string }, ApiClientError, VerifyChangeOtpPayload>({
    mutationFn: async (payload) => {
      const res = await apiClient.post<ApiResponse<{ message: string }>>(
        settingsEndpoints.verifyEmailChange,
        payload,
      );
      return res.data;
    },
  });
}

export function useUpdatePhoneMutation() {
  return useMutation<{ message: string }, ApiClientError, UpdatePhonePayload>({
    mutationFn: async (payload) => {
      const res = await apiClient.post<ApiResponse<{ message: string }>>(
        settingsEndpoints.updatePhone,
        payload,
      );
      return res.data;
    },
  });
}

export function useDeactivateAccountMutation() {
  return useMutation<{ message: string }, ApiClientError, DeactivateAccountPayload>({
    mutationFn: async (payload) => {
      const res = await apiClient.post<ApiResponse<{ message: string }>>(
        settingsEndpoints.deactivateAccount,
        payload,
      );
      return res.data;
    },
  });
}
