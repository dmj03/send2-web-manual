import { SearchResultsSkeleton } from '@/features/search/components';

export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Filter bar skeleton */}
      <div className="sticky top-0 z-20 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-10 w-28 animate-pulse rounded-xl bg-gray-200" />
            <div className="h-10 w-20 animate-pulse rounded-xl bg-gray-200" />
            <div className="h-10 w-36 animate-pulse rounded-xl bg-gray-200" />
            <div className="ml-auto h-9 w-24 animate-pulse rounded-xl bg-gray-200" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Sort bar skeleton */}
        <div className="mb-4 flex items-center justify-between">
          <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
          <div className="h-9 w-36 animate-pulse rounded-xl bg-gray-200" />
        </div>

        <SearchResultsSkeleton count={6} />
      </div>
    </div>
  );
}
