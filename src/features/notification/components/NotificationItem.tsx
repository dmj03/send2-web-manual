'use client';

import { NotificationIcon } from './NotificationIcon';
import type { AppNotification } from '@/types/notification';

interface NotificationItemProps {
  notification: AppNotification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  isMarking: boolean;
  isDeleting: boolean;
}

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function NotificationItem({
  notification: n,
  onMarkRead,
  onDelete,
  isMarking,
  isDeleting,
}: NotificationItemProps) {
  return (
    <li
      data-testid="notification-item"
      className={`group flex items-start gap-4 px-5 py-4 transition-colors ${
        !n.isRead ? 'bg-blue-50/40' : 'bg-white hover:bg-gray-50'
      }`}
    >
      {/* Unread indicator dot */}
      <span
        aria-hidden="true"
        className={`mt-4 h-2 w-2 shrink-0 rounded-full transition-opacity ${
          n.isRead ? 'opacity-0' : 'bg-blue-500 opacity-100'
        }`}
      />

      <NotificationIcon type={n.type} className="mt-0.5" />

      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-medium leading-snug ${
            n.isRead ? 'text-gray-500' : 'text-gray-900'
          }`}
        >
          {n.title}
        </p>
        <p className="mt-0.5 text-sm leading-relaxed text-gray-500">{n.body}</p>
        <p className="mt-1 text-xs text-gray-400">{formatRelative(n.createdAt)}</p>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
        {n.actionUrl && (
          <a
            href={n.actionUrl}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            View
          </a>
        )}

        {!n.isRead && (
          <button
            type="button"
            onClick={() => onMarkRead(n.id)}
            disabled={isMarking}
            aria-label={`Mark "${n.title}" as read`}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Mark read
          </button>
        )}

        <button
          type="button"
          onClick={() => onDelete(n.id)}
          disabled={isDeleting}
          aria-label={`Delete "${n.title}"`}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </li>
  );
}
