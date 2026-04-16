/**
 * Skeleton placeholders for the Profile feature.
 * Each exported component mirrors the layout of its real counterpart so the
 * page shift is minimal when data arrives.
 */

export function ProfileDashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Identity card */}
      <div className="flex items-center gap-5 rounded-2xl border bg-white p-6 shadow-sm">
        <div className="h-20 w-20 shrink-0 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-40 rounded bg-gray-200" />
          <div className="h-4 w-56 rounded bg-gray-100" />
          <div className="h-4 w-24 rounded bg-gray-100" />
        </div>
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="mb-2 h-8 w-8 rounded-xl bg-gray-200" />
            <div className="h-6 w-12 rounded bg-gray-200" />
            <div className="mt-1 h-3 w-20 rounded bg-gray-100" />
          </div>
        ))}
      </div>
      {/* Notification list */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-4 h-5 w-36 rounded bg-gray-200" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 py-3">
            <div className="mt-0.5 h-8 w-8 shrink-0 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-48 rounded bg-gray-200" />
              <div className="h-3 w-64 rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PersonalInfoSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-6 h-6 w-32 rounded bg-gray-200" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-20 rounded bg-gray-200" />
              <div className="h-10 w-full rounded-xl bg-gray-100" />
            </div>
          ))}
        </div>
        <div className="mt-6 h-10 w-28 rounded-xl bg-gray-200" />
      </div>
    </div>
  );
}

export function NotificationsSkeleton() {
  return (
    <div className="animate-pulse divide-y divide-gray-100 rounded-2xl border bg-white shadow-sm">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-5 py-4">
          <div className="mt-0.5 h-9 w-9 shrink-0 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-48 rounded bg-gray-200" />
            <div className="h-3 w-72 rounded bg-gray-100" />
            <div className="h-3 w-24 rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SearchHistorySkeleton() {
  return (
    <div className="animate-pulse divide-y divide-gray-100 rounded-2xl border bg-white shadow-sm">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between px-5 py-4">
          <div className="space-y-1.5">
            <div className="h-4 w-36 rounded bg-gray-200" />
            <div className="h-3 w-24 rounded bg-gray-100" />
          </div>
          <div className="h-8 w-8 rounded-lg bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

export function ReferralSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-4 h-6 w-40 rounded bg-gray-200" />
        <div className="mb-6 h-14 w-full rounded-xl bg-gray-100" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-gray-100 p-4">
              <div className="mx-auto mb-1 h-7 w-12 rounded bg-gray-200" />
              <div className="mx-auto h-3 w-20 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
