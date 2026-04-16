import type { NotificationFilter } from './NotificationFilterTabs';

interface NotificationEmptyStateProps {
  filter: NotificationFilter;
}

export function NotificationEmptyState({ filter }: NotificationEmptyStateProps) {
  const isFiltered = filter === 'unread';

  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center rounded-2xl border bg-white px-6 py-16 shadow-sm"
    >
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100" aria-hidden="true">
        {isFiltered ? (
          <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ) : (
          <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        )}
      </span>

      <h3 className="text-base font-semibold text-gray-900">
        {isFiltered ? 'All caught up!' : 'No notifications yet'}
      </h3>
      <p className="mt-1 max-w-xs text-center text-sm text-gray-500">
        {isFiltered
          ? 'You have no unread notifications right now.'
          : "We'll notify you about rate alerts, transfers, and important updates."}
      </p>
    </div>
  );
}
