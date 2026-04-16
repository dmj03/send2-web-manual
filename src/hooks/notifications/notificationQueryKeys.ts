export const notificationQueryKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationQueryKeys.all, 'list'] as const,
  unreadCount: () => [...notificationQueryKeys.all, 'unreadCount'] as const,
} as const;
