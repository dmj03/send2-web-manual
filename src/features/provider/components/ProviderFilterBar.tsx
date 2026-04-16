'use client';

import type { TransferMethod } from '@/types/provider';
import type { ProviderFilters, SortKey } from '../hooks/useProviderFilters';

interface ProviderFilterBarProps {
  filters: ProviderFilters;
  totalCount: number;
  filteredCount: number;
  onQueryChange: (query: string) => void;
  onTransferMethodChange: (method: TransferMethod | '') => void;
  onVerifiedOnlyChange: (value: boolean) => void;
  onSortChange: (key: SortKey) => void;
  onReset: () => void;
}

const TRANSFER_METHOD_OPTIONS: { value: TransferMethod | ''; label: string }[] = [
  { value: '', label: 'All methods' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'mobile_money', label: 'Mobile money' },
  { value: 'cash_pickup', label: 'Cash pickup' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'debit_card', label: 'Debit card' },
  { value: 'credit_card', label: 'Credit card' },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'rating', label: 'Top rated' },
  { value: 'reviews', label: 'Most reviewed' },
  { value: 'name', label: 'Name (A–Z)' },
];

export function ProviderFilterBar({
  filters,
  totalCount,
  filteredCount,
  onQueryChange,
  onTransferMethodChange,
  onVerifiedOnlyChange,
  onSortChange,
  onReset,
}: ProviderFilterBarProps) {
  const hasActiveFilters =
    filters.query || filters.transferMethod || filters.verifiedOnly;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <label htmlFor="provider-search" className="sr-only">
            Search providers
          </label>
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
          <input
            id="provider-search"
            type="search"
            value={filters.query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search providers…"
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Transfer method */}
        <div>
          <label htmlFor="transfer-method" className="sr-only">
            Filter by transfer method
          </label>
          <select
            id="transfer-method"
            value={filters.transferMethod}
            onChange={(e) =>
              onTransferMethodChange(e.target.value as TransferMethod | '')
            }
            className="rounded-lg border border-gray-200 py-2 pl-3 pr-8 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {TRANSFER_METHOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div>
          <label htmlFor="provider-sort" className="sr-only">
            Sort providers
          </label>
          <select
            id="provider-sort"
            value={filters.sortKey}
            onChange={(e) => onSortChange(e.target.value as SortKey)}
            className="rounded-lg border border-gray-200 py-2 pl-3 pr-8 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Verified toggle */}
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 select-none">
          <input
            type="checkbox"
            checked={filters.verifiedOnly}
            onChange={(e) => onVerifiedOnlyChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Verified only
        </label>
      </div>

      {/* Results count + reset */}
      <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3">
        <p className="text-sm text-gray-500">
          {filteredCount === totalCount ? (
            <>{totalCount} providers</>
          ) : (
            <>
              <span className="font-medium text-gray-900">{filteredCount}</span> of {totalCount}{' '}
              providers
            </>
          )}
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-medium text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
