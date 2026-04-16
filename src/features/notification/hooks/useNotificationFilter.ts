'use client';

import { useState, useMemo } from 'react';
import type { AppNotification } from '@/types/notification';
import type { NotificationFilter } from '../components/NotificationFilterTabs';

export function useNotificationFilter(notifications: AppNotification[] | undefined) {
  const [filter, setFilter] = useState<NotificationFilter>('all');

  const unreadCount = useMemo(
    () => (notifications ?? []).filter((n) => !n.isRead).length,
    [notifications],
  );

  const filtered = useMemo(() => {
    if (!notifications) return [];
    if (filter === 'unread') return notifications.filter((n) => !n.isRead);
    return notifications;
  }, [notifications, filter]);

  return { filter, setFilter, filtered, unreadCount };
}
