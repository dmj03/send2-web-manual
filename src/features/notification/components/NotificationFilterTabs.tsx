'use client';

export type NotificationFilter = 'all' | 'unread';

interface NotificationFilterTabsProps {
  active: NotificationFilter;
  unreadCount: number;
  onChange: (filter: NotificationFilter) => void;
}

const TABS: { value: NotificationFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
];

export function NotificationFilterTabs({
  active,
  unreadCount,
  onChange,
}: NotificationFilterTabsProps) {
  return (
    <div role="tablist" aria-label="Filter notifications" className="flex gap-1">
      {TABS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={active === value}
          onClick={() => onChange(value)}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            active === value
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {label}
          {value === 'unread' && unreadCount > 0 && (
            <span
              aria-label={`${unreadCount} unread`}
              className={`inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                active === 'unread'
                  ? 'bg-white text-blue-600'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
