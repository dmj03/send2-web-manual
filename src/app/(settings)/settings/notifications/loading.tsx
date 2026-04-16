export default function NotificationSettingsLoading() {
  const rows = [
    'Rate Alerts',
    'Transfer Updates',
    'Promotions',
    'News & Announcements',
    'Account Security',
    'Weekly Digest',
  ];

  return (
    <div>
      <div className="mb-6 space-y-2">
        <div className="h-8 w-36 animate-pulse rounded-md bg-gray-200" />
        <div className="h-4 w-80 animate-pulse rounded-md bg-gray-200" />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm" aria-busy="true">
        {/* Channel header */}
        <div className="grid grid-cols-4 gap-4 border-b border-gray-100 px-6 py-3">
          <div className="col-span-1 h-4 w-20 animate-pulse rounded bg-gray-200" />
          {['Email', 'Push', 'SMS'].map((ch) => (
            <div key={ch} className="flex justify-center">
              <div className="h-4 w-10 animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>

        {/* Row skeletons */}
        {rows.map((row) => (
          <div
            key={row}
            className="grid grid-cols-4 items-center gap-4 border-b border-gray-50 px-6 py-4 last:border-0"
          >
            <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex justify-center">
                <div className="h-5 w-9 animate-pulse rounded-full bg-gray-200" />
              </div>
            ))}
          </div>
        ))}

        <div className="flex justify-end border-t border-gray-100 px-6 py-4">
          <div className="h-9 w-32 animate-pulse rounded-lg bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
