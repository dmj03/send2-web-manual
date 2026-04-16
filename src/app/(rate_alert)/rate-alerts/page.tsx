import { Suspense } from 'react';
import type { Metadata } from 'next';
import { RateAlertListContainer } from '@/features/rate_alert/components';
import { RateAlertListSkeleton } from '@/features/rate_alert/components';

export const metadata: Metadata = {
  title: 'Rate Alerts | Send2',
  description:
    'Set target exchange rates and get notified the moment a provider hits your target — never miss the best rate again.',
};

export default function RateAlertsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Rate Alerts
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          We&apos;ll notify you the moment a provider reaches your target exchange
          rate.
        </p>
      </div>

      <Suspense fallback={<RateAlertListSkeleton />}>
        <RateAlertListContainer />
      </Suspense>
    </div>
  );
}
