'use client';

import { Suspense } from 'react';
import { useSearchFilters } from '@/features/search/hooks';
import { useSearchQuery } from '@/hooks/search';
import { SearchFilterBar } from './SearchFilterBar';
import { SearchSortBar } from './SearchSortBar';
import { SearchResultCard } from './SearchResultCard';
import { CompareBasketDrawer } from './CompareBasketDrawer';
import { SearchResultsSkeleton } from './SearchSkeletons';
import type { SearchFilters } from '@/types/search';

interface EmptyStateProps {
  sendCurrency: string;
  receiveCurrency: string;
}

function EmptyState({ sendCurrency, receiveCurrency }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <svg
          className="h-8 w-8 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.65 16.65 7.5 7.5 0 0016.65 16.65z"
          />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-gray-900">No providers found</h2>
      <p className="mt-1 max-w-xs text-sm text-gray-500">
        No providers currently support sending {sendCurrency} →{' '}
        {receiveCurrency}. Try adjusting your filters.
      </p>
    </div>
  );
}

function NoFiltersState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-sm text-gray-500">
        Use the form above to search for money transfer providers.
      </p>
    </div>
  );
}

interface SearchResultsInnerProps {
  filters: SearchFilters;
}

function SearchResultsInner({ filters }: SearchResultsInnerProps) {
  const { activeFilters, setSort } = useSearchFilters();
  const { data, isFetching, isError, error } = useSearchQuery(filters);

  const results = data?.results ?? [];
  const total = data?.meta.total ?? 0;

  if (isError) {
    throw error;
  }

  return (
    <>
      <SearchSortBar
        filters={activeFilters}
        totalCount={isFetching ? 0 : total}
        onSort={setSort}
      />

      {isFetching && results.length === 0 ? (
        <SearchResultsSkeleton count={6} />
      ) : results.length === 0 ? (
        <EmptyState
          sendCurrency={filters.sendCurrency}
          receiveCurrency={filters.receiveCurrency}
        />
      ) : (
        <>
          {isFetching && (
            <div className="mb-3 flex items-center gap-2 text-xs text-blue-600">
              <svg
                className="h-3.5 w-3.5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Refreshing rates…
            </div>
          )}

          <ul className="space-y-3" aria-label="Search results" aria-live="polite">
            {results.map((result) => (
              <SearchResultCard
                key={result.id}
                result={result}
                sendCurrency={filters.sendCurrency}
                receiveCurrency={filters.receiveCurrency}
              />
            ))}
          </ul>

          {data && (
            <p className="mt-4 text-center text-xs text-gray-400">
              Rates last updated{' '}
              {new Date(data.lastUpdated).toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
              })}
              . Live data — updates every minute.
            </p>
          )}
        </>
      )}
    </>
  );
}

interface SearchResultsContainerProps {
  initialFilters: SearchFilters | null;
}

export function SearchResultsContainer({ initialFilters }: SearchResultsContainerProps) {
  const { activeFilters } = useSearchFilters();

  // Merge: URL params take precedence over server-passed initial filters
  const filters = activeFilters ?? initialFilters;

  return (
    <>
      <SearchFilterBar filters={activeFilters} />

      <main className="mx-auto max-w-5xl px-4 py-6">
        {filters ? (
          <Suspense fallback={<SearchResultsSkeleton count={6} />}>
            <SearchResultsInner filters={filters} />
          </Suspense>
        ) : (
          <NoFiltersState />
        )}
      </main>

      <CompareBasketDrawer />
    </>
  );
}
