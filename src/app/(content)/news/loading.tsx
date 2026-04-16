import { ArticleGridSkeleton } from '@/features/content/components/ContentSkeletons';

export default function NewsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header skeleton */}
      <div className="mb-10">
        <div className="h-9 w-72 animate-pulse rounded-lg bg-gray-200 sm:h-10" />
        <div className="mt-2 h-5 w-96 animate-pulse rounded bg-gray-100" />
      </div>

      <ArticleGridSkeleton count={9} />
    </div>
  );
}
