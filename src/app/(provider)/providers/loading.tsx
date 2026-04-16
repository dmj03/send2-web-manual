import { ProviderFilterBarSkeleton, ProviderGridSkeleton } from '@/features/provider/components/ProviderListSkeletons';

export default function ProvidersLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Page header skeleton */}
      <div className="animate-pulse">
        <div className="mb-2 h-8 w-64 rounded bg-gray-200" />
        <div className="mb-8 h-4 w-96 rounded bg-gray-100" />
      </div>

      <div className="space-y-6">
        <ProviderFilterBarSkeleton />
        <ProviderGridSkeleton count={9} />
      </div>
    </div>
  );
}
