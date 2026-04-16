import { RateAlertListSkeleton } from '@/features/rate_alert/components';

export default function RateAlertsLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header skeleton */}
      <div className="mb-8 animate-pulse space-y-2">
        <div className="h-8 w-48 rounded-lg bg-gray-200" />
        <div className="h-4 w-80 rounded bg-gray-200" />
      </div>

      <RateAlertListSkeleton />
    </div>
  );
}
