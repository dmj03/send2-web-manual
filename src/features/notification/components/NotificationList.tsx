'use client';

import { useNotificationsQuery, useMarkReadMutation, useMarkAllReadMutation } from '@/hooks/notifications';
import { useNotificationFilter } from '../hooks/useNotificationFilter';
import { useDeleteNotificationMutation } from '../hooks/useDeleteNotificationMutation';
import { NotificationFilterTabs } from './NotificationFilterTabs';
import { NotificationItem } from './NotificationItem';
import { NotificationEmptyState } from './NotificationEmptyState';
import { NotificationListSkeleton } from './NotificationSkeletons';

export function NotificationList() {
  const { data: notifications, isPending, isError, error } = useNotificationsQuery();
  const { filter, setFilter, filtered, unreadCount } = useNotificationFilter(notifications);
  const markReadMutation = useMarkReadMutation();
  const markAllReadMutation = useMarkAllReadMutation();
  const deleteMutation = useDeleteNotificationMutation();

  if (isPending) return <NotificationListSkeleton />;

  if (isError) {
    return (
      <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm font-medium text-red-800">Failed to load notifications</p>
        <p className="mt-1 text-sm text-red-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <NotificationFilterTabs
          active={filter}
          unreadCount={unreadCount}
          onChange={setFilter}
        />

        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500">
            {notifications.length === 0
              ? 'No notifications'
              : `${notifications.length} notification${notifications.length === 1 ? '' : 's'}`}
          </p>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="text-xs font-medium text-blue-600 transition hover:underline disabled:opacity-40"
            >
              {markAllReadMutation.isPending ? 'Marking…' : 'Mark all as read'}
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <NotificationEmptyState filter={filter} />
      ) : (
        <ul
          aria-label="Notifications"
          className="divide-y divide-gray-100 overflow-hidden rounded-2xl border bg-white shadow-sm"
        >
          {filtered.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onMarkRead={(id) => markReadMutation.mutate(id)}
              onDelete={(id) => deleteMutation.mutate(id)}
              isMarking={markReadMutation.isPending}
              isDeleting={deleteMutation.isPending}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
