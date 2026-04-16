import { ArticleGridSkeleton } from '@/features/content/components/ContentSkeletons';

export default function BlogLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header skeleton */}
      <div className="mb-10">
        <div className="h-9 w-48 animate-pulse rounded-lg bg-gray-200 sm:h-10" />
        <div className="mt-2 h-5 w-80 animate-pulse rounded bg-gray-100" />
      </div>

      {/* Filter tabs skeleton */}
      <div className="mb-6 flex gap-2">
        {[52, 40, 48, 52, 72].map((w, i) => (
          <div
            key={i}
            className="h-8 animate-pulse rounded-full bg-gray-200"
            style={{ width: `${w * 2}px` }}
          />
        ))}
      </div>

      <ArticleGridSkeleton count={9} />
    </div>
  );
}
