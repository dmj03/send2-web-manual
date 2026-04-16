export function ProviderFilterBarSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="h-9 flex-1 rounded-lg bg-gray-100" />
        <div className="h-9 w-40 rounded-lg bg-gray-100" />
        <div className="h-9 w-32 rounded-lg bg-gray-100" />
        <div className="h-5 w-28 rounded bg-gray-100" />
      </div>
      <div className="mt-3 border-t border-gray-50 pt-3">
        <div className="h-4 w-24 rounded bg-gray-100" />
      </div>
    </div>
  );
}

function ProviderCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="h-10 w-28 rounded bg-gray-100" />
        <div className="h-5 w-16 rounded-full bg-gray-100" />
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-4 w-3/4 rounded bg-gray-100" />
        <div className="h-3 w-full rounded bg-gray-100" />
        <div className="h-3 w-5/6 rounded bg-gray-100" />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-3.5 w-3.5 rounded bg-gray-100" />
          ))}
        </div>
        <div className="h-3 w-24 rounded bg-gray-100" />
      </div>
      <div className="mt-3 flex gap-1.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-5 w-14 rounded-full bg-gray-100" />
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-4">
        <div className="h-7 w-24 rounded-full bg-gray-100" />
        <div className="h-4 w-20 rounded bg-gray-100" />
      </div>
    </div>
  );
}

export function ProviderGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading providers">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <ProviderCardSkeleton />
        </li>
      ))}
    </ul>
  );
}
