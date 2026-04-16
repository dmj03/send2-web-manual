export function RateAlertCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border bg-white p-5 shadow-sm" aria-hidden="true">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-10 rounded bg-gray-200" />
          <div className="h-4 w-4 rounded bg-gray-100" />
          <div className="h-6 w-10 rounded bg-gray-200" />
        </div>
        <div className="h-6 w-11 rounded-full bg-gray-200" />
      </div>

      {/* Rate boxes */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-gray-50 p-4">
          <div className="h-3 w-20 rounded bg-gray-200" />
          <div className="mt-2 h-7 w-24 rounded bg-gray-200" />
        </div>
        <div className="rounded-xl bg-gray-50 p-4">
          <div className="h-3 w-20 rounded bg-gray-200" />
          <div className="mt-2 h-7 w-24 rounded bg-gray-200" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 space-y-1">
        <div className="flex justify-between">
          <div className="h-3 w-28 rounded bg-gray-200" />
          <div className="h-3 w-16 rounded bg-gray-200" />
        </div>
        <div className="h-2 w-full rounded-full bg-gray-200" />
      </div>

      {/* Channels */}
      <div className="mt-4 flex gap-1.5">
        <div className="h-5 w-12 rounded-full bg-gray-200" />
        <div className="h-5 w-10 rounded-full bg-gray-200" />
      </div>

      {/* Footer */}
      <div className="mt-4 border-t border-gray-100 pt-4">
        <div className="h-3 w-36 rounded bg-gray-200" />
      </div>
    </div>
  );
}

export function RateAlertListSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading rate alerts">
      {/* Form skeleton */}
      <div className="animate-pulse rounded-2xl border bg-white p-6 shadow-sm">
        <div className="h-5 w-32 rounded bg-gray-200" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <div className="h-3 w-20 rounded bg-gray-200" />
            <div className="h-10 rounded-xl bg-gray-200" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-20 rounded bg-gray-200" />
            <div className="h-10 rounded-xl bg-gray-200" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-24 rounded bg-gray-200" />
            <div className="h-10 rounded-xl bg-gray-200" />
          </div>
        </div>
        <div className="mt-4 h-10 w-full rounded-xl bg-gray-200" />
      </div>

      {/* Card skeletons */}
      {Array.from({ length: 3 }).map((_, i) => (
        <RateAlertCardSkeleton key={i} />
      ))}
    </div>
  );
}
