/** Skeleton components for content (blog / news) pages. */

export function ArticleCardSkeleton() {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      {/* Featured image */}
      <div className="aspect-[16/9] animate-pulse bg-gray-200" />
      <div className="flex flex-1 flex-col p-5">
        {/* Category badge */}
        <div className="mb-3 h-5 w-20 animate-pulse rounded-full bg-gray-100" />
        {/* Title */}
        <div className="mb-2 space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-gray-200" />
        </div>
        {/* Excerpt */}
        <div className="mt-2 space-y-1.5">
          <div className="h-3.5 w-full animate-pulse rounded bg-gray-100" />
          <div className="h-3.5 w-11/12 animate-pulse rounded bg-gray-100" />
          <div className="h-3.5 w-3/4 animate-pulse rounded bg-gray-100" />
        </div>
        {/* Footer */}
        <div className="mt-4 flex items-center gap-3 pt-4 border-t border-gray-100">
          <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
          <div className="space-y-1">
            <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      </div>
    </article>
  );
}

export function ArticleGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <ArticleCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ArticleDetailSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2">
        <div className="h-3.5 w-10 animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-1 animate-pulse rounded bg-gray-100" />
        <div className="h-3.5 w-20 animate-pulse rounded bg-gray-200" />
      </div>

      {/* Category badge */}
      <div className="mb-4 h-5 w-24 animate-pulse rounded-full bg-gray-100" />

      {/* Title */}
      <div className="mb-6 space-y-3">
        <div className="h-7 w-full animate-pulse rounded bg-gray-200" />
        <div className="h-7 w-5/6 animate-pulse rounded bg-gray-200" />
        <div className="h-7 w-2/3 animate-pulse rounded bg-gray-200" />
      </div>

      {/* Author row */}
      <div className="mb-8 flex items-center gap-3 border-b border-t border-gray-100 py-4">
        <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-28 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
        </div>
      </div>

      {/* Featured image */}
      <div className="mb-8 aspect-[16/9] animate-pulse rounded-2xl bg-gray-200" />

      {/* Body paragraphs */}
      <div className="space-y-4">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-11/12 animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
