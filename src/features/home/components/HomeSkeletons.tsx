export function FeaturedProvidersSkeleton() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading providers">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="rounded-xl border border-gray-100 bg-white p-5">
          <div className="flex items-start justify-between">
            <div className="h-10 w-24 animate-pulse rounded-md bg-gray-200" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-gray-100" />
          </div>
          <div className="mt-3 space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="mt-4 flex gap-2">
            <div className="h-3.5 w-20 animate-pulse rounded bg-gray-100" />
            <div className="h-3.5 w-28 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="mt-3 flex gap-1">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-5 w-12 animate-pulse rounded-full bg-gray-100" />
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function PromoBannersSkeleton() {
  return (
    <div>
      <div className="mb-4 h-4 w-28 animate-pulse rounded bg-gray-200" />
      <div className="flex gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-24 min-w-[260px] flex-1 animate-pulse rounded-xl bg-gray-200 sm:min-w-0"
          />
        ))}
      </div>
    </div>
  );
}

export function LatestArticlesSkeleton() {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <li key={i} className="overflow-hidden rounded-xl border border-gray-100 bg-white">
          <div className="h-44 w-full animate-pulse bg-gray-200" />
          <div className="space-y-2 p-4">
            <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-gray-100" />
            <div className="mt-4 flex items-center gap-2">
              <div className="h-5 w-5 animate-pulse rounded-full bg-gray-200" />
              <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
