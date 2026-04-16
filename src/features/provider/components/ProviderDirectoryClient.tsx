'use client';

import type { Provider } from '@/types/provider';
import { useProviderFilters } from '../hooks/useProviderFilters';
import { ProviderFilterBar } from './ProviderFilterBar';
import { ProviderCard } from './ProviderCard';

interface ProviderDirectoryClientProps {
  providers: Provider[];
}

export function ProviderDirectoryClient({ providers }: ProviderDirectoryClientProps) {
  const { filters, filtered, setQuery, setTransferMethod, setVerifiedOnly, setSort, reset } =
    useProviderFilters(providers);

  return (
    <div className="space-y-6">
      <ProviderFilterBar
        filters={filters}
        totalCount={providers.length}
        filteredCount={filtered.length}
        onQueryChange={setQuery}
        onTransferMethodChange={setTransferMethod}
        onVerifiedOnlyChange={setVerifiedOnly}
        onSortChange={setSort}
        onReset={reset}
      />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
          <svg
            className="mb-4 h-12 w-12 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z"
            />
          </svg>
          <p className="text-sm font-medium text-gray-700">No providers found</p>
          <p className="mt-1 text-xs text-gray-400">Try adjusting your filters</p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 text-sm font-medium text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <ul
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          aria-label="Money transfer providers"
        >
          {filtered.map((provider) => (
            <li key={provider.id}>
              <ProviderCard provider={provider} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
