'use client';

import { useNotificationsQuery, useMarkReadMutation, useMarkAllReadMutation } from '@/hooks/notifications';
import type { AppNotification } from '@/types/notification';
import { NotificationsSkeleton } from './ProfileSkeletons';

// ─── Icon colour by type ──────────────────────────────────────────────────────

const TYPE_STYLES: Record<AppNotification['type'], { bg: string; icon: string }> = {
  rate_alert_triggered: { bg: 'bg-amber-100', icon: 'text-amber-600' },
  transfer_complete: { bg: 'bg-green-100', icon: 'text-green-600' },
  transfer_failed: { bg: 'bg-red-100', icon: 'text-red-600' },
  kyc_approved: { bg: 'bg-green-100', icon: 'text-green-600' },
  kyc_rejected: { bg: 'bg-red-100', icon: 'text-red-600' },
  promotion: { bg: 'bg-purple-100', icon: 'text-purple-600' },
  system: { bg: 'bg-gray-100', icon: 'text-gray-600' },
  news: { bg: 'bg-blue-100', icon: 'text-blue-600' },
};

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Single item ──────────────────────────────────────────────────────────────

interface NotificationItemProps {
  notification: AppNotification;
  onMarkRead: (id: string) => void;
  isMarking: boolean;
}

function NotificationItem({ notification: n, onMarkRead, isMarking }: NotificationItemProps) {
  const style = TYPE_STYLES[n.type];

  return (
    <li className={`flex items-start gap-4 px-5 py-4 transition ${!n.isRead ? 'bg-blue-50/50' : 'bg-white'}`}>
      <div
        className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${style.bg}`}
        aria-hidden="true"
      >
        <svg className={`h-5 w-5 ${style.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${n.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
          {n.title}
        </p>
        <p className="mt-0.5 text-sm text-gray-500">{n.body}</p>
        <p className="mt-1 text-xs text-gray-400">{formatRelative(n.createdAt)}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {!n.isRead && (
          <button
            type="button"
            onClick={() => onMarkRead(n.id)}
            disabled={isMarking}
            aria-label={`Mark "${n.title}" as read`}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-100 disabled:opacity-50"
          >
            Mark read
          </button>
        )}
        {n.actionUrl && (
          <a
            href={n.actionUrl}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition hover:bg-gray-100"
          >
            View
          </a>
        )}
      </div>
    </li>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function NotificationCentreList() {
  const { data: notifications, isPending, isError, error } = useNotificationsQuery();
  const markReadMutation = useMarkReadMutation();
  const markAllReadMutation = useMarkAllReadMutation();

  if (isPending) return <NotificationsSkeleton />;

  if (isError) {
    return (
      <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error.message || 'Failed to load notifications.'}
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {unreadCount > 0 ? (
            <>
              <span className="font-semibold text-gray-900">{unreadCount}</span> unread
            </>
          ) : (
            'All caught up!'
          )}
        </p>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="text-xs font-medium text-blue-600 transition hover:underline disabled:opacity-50"
          >
            {markAllReadMutation.isPending ? 'Marking…' : 'Mark all as read'}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center shadow-sm">
          <svg className="mx-auto mb-3 h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-gray-500">No notifications yet.</p>
        </div>
      ) : (
        <ul
          aria-label="Notifications"
          className="divide-y divide-gray-100 overflow-hidden rounded-2xl border bg-white shadow-sm"
        >
          {notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onMarkRead={(id) => markReadMutation.mutate(id)}
              isMarking={markReadMutation.isPending}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
