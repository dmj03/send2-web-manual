'use client';

import { useState } from 'react';
import { useRateAlertsQuery } from '@/hooks/rateAlerts';
import { RateAlertCard } from './RateAlertCard';
import { RateAlertForm } from './RateAlertForm';
import { RateAlertEmptyState } from './RateAlertEmptyState';
import { RateAlertListSkeleton } from './RateAlertSkeletons';

export function RateAlertListContainer() {
  const { data: alerts, isLoading, isError, error, refetch } = useRateAlertsQuery();
  const [showForm, setShowForm] = useState(false);

  if (isLoading) return <RateAlertListSkeleton />;

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
        <p className="text-sm font-medium text-red-700">
          {error?.message || 'Could not load your rate alerts.'}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Retry
        </button>
      </div>
    );
  }

  const hasAlerts = alerts && alerts.length > 0;

  return (
    <div className="space-y-6">
      {/* Create form — always shown when user has alerts; shown in place of empty state if triggered */}
      {(hasAlerts || showForm) && (
        <RateAlertForm onSuccess={() => setShowForm(false)} />
      )}

      {/* Alert list or empty state */}
      {hasAlerts ? (
        <section aria-label="Your rate alerts">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">
              {alerts.length} {alerts.length === 1 ? 'alert' : 'alerts'}
            </h2>
            {!showForm && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                New alert
              </button>
            )}
          </div>
          <ul className="space-y-4" role="list">
            {alerts.map((alert) => (
              <li key={alert.id}>
                <RateAlertCard alert={alert} />
              </li>
            ))}
          </ul>
        </section>
      ) : (
        !showForm && (
          <RateAlertEmptyState onCreateClick={() => setShowForm(true)} />
        )
      )}
    </div>
  );
}
