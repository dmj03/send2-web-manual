export function NotificationListSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading notifications">
      {/* Header row skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <div className="h-8 w-12 animate-pulse rounded-lg bg-gray-200" />
          <div className="h-8 w-20 animate-pulse rounded-lg bg-gray-200" />
        </div>
        <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
      </div>

      {/* Item list skeleton */}
      <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border bg-white shadow-sm">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-4 px-5 py-4">
            <div className="mt-4 h-2 w-2 shrink-0 rounded-full bg-gray-200" />
            <div className="mt-0.5 h-10 w-10 shrink-0 animate-pulse rounded-full bg-gray-200" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-72 animate-pulse rounded bg-gray-100" />
              <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
