'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import {
  useSearchHistoryQuery,
  useDeleteSearchHistoryMutation,
  useClearSearchHistoryMutation,
} from '@/features/profile/hooks/useSearchHistoryQuery';
import { SearchHistorySkeleton } from './ProfileSkeletons';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SearchHistoryList() {
  const { data: entries, isPending, isError, error } = useSearchHistoryQuery();
  const deleteMutation = useDeleteSearchHistoryMutation();
  const clearMutation = useClearSearchHistoryMutation();
  const [confirmClear, setConfirmClear] = useState(false);

  if (isPending) return <SearchHistorySkeleton />;

  if (isError) {
    return (
      <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error.message || 'Failed to load search history.'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {entries.length > 0 ? (
            <>
              <span className="font-semibold text-gray-900">{entries.length}</span>{' '}
              {entries.length === 1 ? 'search' : 'searches'}
            </>
          ) : (
            'No searches yet'
          )}
        </p>
        {entries.length > 0 && (
          <>
            {confirmClear ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">Clear all history?</span>
                <button
                  type="button"
                  onClick={() => {
                    clearMutation.mutate(undefined, { onSuccess: () => setConfirmClear(false) });
                  }}
                  disabled={clearMutation.isPending}
                  className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                >
                  {clearMutation.isPending ? 'Clearing…' : 'Yes, clear'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="text-xs text-gray-400 hover:underline"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="text-xs font-medium text-red-500 transition hover:underline"
              >
                Clear all
              </button>
            )}
          </>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center shadow-sm">
          <svg className="mx-auto mb-3 h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-sm text-gray-500">Your search history will appear here.</p>
          <Link href={'/search' as Route} className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline">
            Search for a provider
          </Link>
        </div>
      ) : (
        <ul
          aria-label="Search history"
          className="divide-y divide-gray-100 overflow-hidden rounded-2xl border bg-white shadow-sm"
        >
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {entry.fromCurrency} → {entry.toCurrency}
                  <span className="ml-2 font-normal text-gray-500">
                    {entry.sendAmount.toLocaleString('en-GB', {
                      style: 'currency',
                      currency: entry.fromCurrency,
                    })}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {entry.receiveCountry} · {formatDate(entry.searchedAt)}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={`/search?from=${entry.fromCurrency}&to=${entry.toCurrency}&amount=${entry.sendAmount}` as Route}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-50"
                >
                  Repeat
                </Link>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(entry.id)}
                  disabled={deleteMutation.isPending}
                  aria-label={`Remove search from ${entry.fromCurrency} to ${entry.toCurrency}`}
                  className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
