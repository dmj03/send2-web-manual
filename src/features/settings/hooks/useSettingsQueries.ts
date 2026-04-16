'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { settingsEndpoints } from '@/lib/api/endpoints';
import type { ApiResponse } from '@/types/api';
import type {
  UserPreferences,
  NotificationPreferences,
  PrivacyPreferences,
  TwoFactorStatus,
  ActiveSession,
} from '@/types/settings';

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const settingsQueryKeys = {
  all: ['settings'] as const,
  preferences: () => [...settingsQueryKeys.all, 'preferences'] as const,
  notificationPreferences: () =>
    [...settingsQueryKeys.all, 'notification-preferences'] as const,
  privacy: () => [...settingsQueryKeys.all, 'privacy'] as const,
  twoFactorStatus: () => [...settingsQueryKeys.all, '2fa-status'] as const,
  sessions: () => [...settingsQueryKeys.all, 'sessions'] as const,
} as const;

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function usePreferencesQuery() {
  return useQuery<UserPreferences, ApiClientError>({
    queryKey: settingsQueryKeys.preferences(),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<ApiResponse<UserPreferences>>(
        settingsEndpoints.preferences,
        { signal },
      );
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useNotificationPreferencesQuery() {
  return useQuery<NotificationPreferences, ApiClientError>({
    queryKey: settingsQueryKeys.notificationPreferences(),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<ApiResponse<NotificationPreferences>>(
        settingsEndpoints.notificationPreferences,
        { signal },
      );
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePrivacyPreferencesQuery() {
  return useQuery<PrivacyPreferences, ApiClientError>({
    queryKey: settingsQueryKeys.privacy(),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<ApiResponse<PrivacyPreferences>>(
        settingsEndpoints.privacy,
        { signal },
      );
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useTwoFactorStatusQuery() {
  return useQuery<TwoFactorStatus, ApiClientError>({
    queryKey: settingsQueryKeys.twoFactorStatus(),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<ApiResponse<TwoFactorStatus>>(
        settingsEndpoints.twoFactorStatus,
        { signal },
      );
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useActiveSessionsQuery() {
  return useQuery<ActiveSession[], ApiClientError>({
    queryKey: settingsQueryKeys.sessions(),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<ApiResponse<ActiveSession[]>>(
        settingsEndpoints.sessions,
        { signal },
      );
      return res.data;
    },
    staleTime: 60 * 1000,
  });
}
