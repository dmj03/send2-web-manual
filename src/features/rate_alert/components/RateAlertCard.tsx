'use client';

import { useState } from 'react';
import type { RateAlert, NotificationChannel } from '@/types/rate-alert';
import { RateAlertProgressBar } from './RateAlertProgressBar';
import { useDeleteRateAlertMutation } from '@/hooks/rateAlerts';
import { useToggleRateAlertMutation } from '../hooks';

interface RateAlertCardProps {
  alert: RateAlert;
}

const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  email: 'Email',
  push: 'Push',
  sms: 'SMS',
  in_app: 'In-app',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function RateAlertCard({ alert }: RateAlertCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const deleteMutation = useDeleteRateAlertMutation();
  const toggleMutation = useToggleRateAlertMutation();

  const isDeleting = deleteMutation.isPending;
  const isToggling = toggleMutation.isPending;

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteMutation.mutate(alert.id, {
      onSettled: () => setConfirmDelete(false),
    });
  }

  function handleToggle() {
    toggleMutation.mutate({ id: alert.id, isActive: !alert.isActive });
  }

  return (
    <article
      aria-label={`Rate alert: ${alert.fromCurrency} to ${alert.toCurrency}`}
      className={`rounded-2xl border bg-white p-5 shadow-sm transition-opacity ${
        !alert.isActive ? 'opacity-60' : ''
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900">
            {alert.fromCurrency}
          </span>
          <svg
            className="h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
          <span className="text-lg font-bold text-gray-900">
            {alert.toCurrency}
          </span>
        </div>

        {/* Active toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={alert.isActive}
          aria-label={alert.isActive ? 'Deactivate alert' : 'Activate alert'}
          onClick={handleToggle}
          disabled={isToggling || isDeleting}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
            alert.isActive ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
              alert.isActive ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Rate info */}
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-gray-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Target rate
          </p>
          <p className="mt-0.5 text-xl font-bold text-gray-900">
            {alert.targetRate.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 4,
            })}
          </p>
        </div>
        <div className="rounded-xl bg-gray-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Current rate
          </p>
          <p className="mt-0.5 text-xl font-bold text-gray-900">
            {alert.currentRate.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 4,
            })}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <RateAlertProgressBar
          currentRate={alert.currentRate}
          targetRate={alert.targetRate}
        />
      </div>

      {/* Notification channels */}
      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-gray-400">Notify via:</span>
        {alert.notifyVia.map((channel) => (
          <span
            key={channel}
            className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
          >
            {CHANNEL_LABELS[channel]}
          </span>
        ))}
      </div>

      {/* Footer: metadata + delete */}
      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
        <div className="text-xs text-gray-400">
          <span>Created {formatDate(alert.createdAt)}</span>
          {alert.triggeredAt && (
            <span className="ml-2 text-green-600">
              · Last triggered {formatDate(alert.triggeredAt)}
            </span>
          )}
        </div>

        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Delete this alert?</span>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              disabled={isDeleting}
              className="rounded-lg px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            >
              {isDeleting ? (
                <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : null}
              Confirm
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting || isToggling}
            aria-label={`Delete alert for ${alert.fromCurrency} to ${alert.toCurrency}`}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </article>
  );
}
