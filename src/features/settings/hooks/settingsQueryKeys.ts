export const settingsQueryKeys = {
  all: ['settings'] as const,
  preferences: () => [...settingsQueryKeys.all, 'preferences'] as const,
  notificationPreferences: () => [...settingsQueryKeys.all, 'notification-preferences'] as const,
  twoFactorStatus: () => [...settingsQueryKeys.all, 'two-factor-status'] as const,
  sessions: () => [...settingsQueryKeys.all, 'sessions'] as const,
  privacy: () => [...settingsQueryKeys.all, 'privacy'] as const,
} as const;
