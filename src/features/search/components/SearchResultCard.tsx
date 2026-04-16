'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { useCompareStore, selectIsInBasket, selectBasketCount } from '@/stores/compareStore';
import { ROUTES } from '@/lib/navigation';
import type { ProviderResult } from '@/types/provider';

const BASKET_MAX = 3;

interface StarRatingProps {
  rating: number;
  reviewCount: number;
}

function StarRating({ rating, reviewCount }: StarRatingProps) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;

  return (
    <span className="flex items-center gap-1">
      <span aria-hidden="true" className="flex">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i < full;
          const half = !filled && hasHalf && i === full;
          return (
            <svg
              key={i}
              className={[
                'h-3.5 w-3.5',
                filled ? 'text-amber-400' : half ? 'text-amber-300' : 'text-gray-300',
              ].join(' ')}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.163c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.286-3.957z" />
            </svg>
          );
        })}
      </span>
      <span className="text-xs text-gray-500">
        {rating.toFixed(1)}{' '}
        <span className="hidden sm:inline">({reviewCount.toLocaleString()})</span>
      </span>
    </span>
  );
}

interface SearchResultCardProps {
  result: ProviderResult;
  sendCurrency: string;
  receiveCurrency: string;
}

export function SearchResultCard({
  result,
  sendCurrency,
  receiveCurrency,
}: SearchResultCardProps) {
  const addToBasket = useCompareStore((s) => s.addToBasket);
  const removeFromBasket = useCompareStore((s) => s.removeFromBasket);
  const isInBasket = useCompareStore(selectIsInBasket(result.id));
  const basketCount = useCompareStore(selectBasketCount);

  const canAdd = !isInBasket && basketCount < BASKET_MAX;

  const feeLabel = result.totalCost > 0
    ? `${sendCurrency} ${(result.totalCost - result.recipientAmount / result.exchangeRate + result.recipientAmount / result.exchangeRate).toFixed(2)} fee`
    : 'No fee';

  const recipientFormatted = new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(result.recipientAmount);

  const rateFormatted = new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 6,
  }).format(result.exchangeRate);

  return (
    <li className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:p-5">
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
          {result.logoUrl ? (
            <Image
              src={result.logoUrl}
              alt={`${result.name} logo`}
              fill
              sizes="48px"
              className="object-contain p-1"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-full w-full items-center justify-center text-lg font-bold text-gray-400"
            >
              {result.name.charAt(0)}
            </span>
          )}
        </div>

        {/* Provider info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold text-gray-900">
              {result.name}
            </span>
            {result.isVerified && (
              <span
                title="Verified provider"
                className="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-700"
              >
                Verified
              </span>
            )}
            {result.promoLabel && (
              <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                {result.promoLabel}
              </span>
            )}
          </div>
          {result.rating > 0 && (
            <StarRating rating={result.rating} reviewCount={result.reviewCount} />
          )}
          <p className="mt-0.5 truncate text-xs text-gray-400">
            {result.transferSpeed} · {result.transferMethod.replace(/_/g, ' ')}
          </p>
        </div>

        {/* Rate + recipient amount */}
        <div className="hidden flex-col items-end sm:flex">
          <span className="text-xl font-bold text-gray-900">
            {receiveCurrency} {recipientFormatted}
          </span>
          <span className="text-xs text-gray-400">
            Rate: {rateFormatted}
          </span>
        </div>

        {/* Fee */}
        <div className="hidden flex-col items-end md:flex">
          <span className="text-sm font-medium text-gray-700">{feeLabel}</span>
          <span className="text-xs text-gray-400">Total cost</span>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Link
            href={ROUTES.providers.detail(result.slug) as Route}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label={`Send with ${result.name}`}
          >
            Send
          </Link>

          <button
            type="button"
            onClick={() =>
              isInBasket ? removeFromBasket(result.id) : addToBasket(result.id)
            }
            disabled={!canAdd && !isInBasket}
            aria-pressed={isInBasket}
            className={[
              'rounded-xl px-3 py-1.5 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-400',
              isInBasket
                ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                : canAdd
                  ? 'border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600'
                  : 'cursor-not-allowed border border-gray-200 text-gray-300',
            ].join(' ')}
          >
            {isInBasket ? '✓ Comparing' : 'Compare'}
          </button>
        </div>
      </div>

      {/* Mobile: recipient amount */}
      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 sm:hidden">
        <span className="text-xs text-gray-500">You receive</span>
        <span className="font-bold text-gray-900">
          {receiveCurrency} {recipientFormatted}
        </span>
      </div>
    </li>
  );
}
