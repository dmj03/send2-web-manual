'use client';

import Link from 'next/link';
import { useCompareStore } from '@/stores/compareStore';
import { useSearchStore } from '@/stores/searchStore';
import { useProvidersQuery } from '@/hooks/providers';
import { CompareTable } from './CompareTable';
import { CompareTableSkeleton } from './SearchSkeletons';
import { ROUTES } from '@/lib/navigation';
import type { ProviderResult } from '@/types/provider';

export function ComparePageContainer() {
  const basket = useCompareStore((s) => s.basket);
  const clearBasket = useCompareStore((s) => s.clearBasket);
  const filters = useSearchStore((s) => s.filters);

  const sendCurrency = filters.sendCurrency || 'GBP';
  const receiveCurrency = filters.receiveCurrency || 'USD';

  // Fetch providers for the current corridor — basket holds IDs to filter
  const { data: searchData, isFetching } = useProvidersQuery(
    {
      sendAmount: filters.sendAmount || 100,
      sendCurrency,
      receiveCurrency,
      receiveCountry: filters.receiveCountry || '',
    },
    basket.length > 0,
  );

  if (basket.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mx-auto">
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
              d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900">
          Nothing to compare yet
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Add up to 3 providers from the search results to compare them
          side-by-side.
        </p>
        <Link
          href={ROUTES.search}
          className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Go to search
        </Link>
      </div>
    );
  }

  const allResults: ProviderResult[] = searchData?.results ?? [];
  const selectedProviders = allResults.filter((p) => basket.includes(p.id));

  return (
    <div className="mx-auto max-w-5xl px-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compare providers</h1>
          <p className="mt-1 text-sm text-gray-500">
            Side-by-side comparison for {sendCurrency} → {receiveCurrency}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={ROUTES.search}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            ← Back to results
          </Link>
          <button
            type="button"
            onClick={clearBasket}
            className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            Clear
          </button>
        </div>
      </div>

      {isFetching && selectedProviders.length === 0 ? (
        <CompareTableSkeleton />
      ) : selectedProviders.length > 0 ? (
        <CompareTable
          providers={selectedProviders}
          sendCurrency={sendCurrency}
          receiveCurrency={receiveCurrency}
        />
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="text-sm text-amber-800">
            The selected providers are not available for this corridor. Try a
            different search.
          </p>
          <Link
            href={ROUTES.search}
            className="mt-4 inline-block rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            New search
          </Link>
        </div>
      )}
    </div>
  );
}
