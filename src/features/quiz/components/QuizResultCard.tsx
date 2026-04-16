'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ProviderResult } from '@/types/provider';

interface QuizResultCardProps {
  result: ProviderResult;
  rank: number;
  sendCurrency: string;
  receiveCurrency: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={[
            'h-3.5 w-3.5',
            star <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200',
          ].join(' ')}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-xs text-gray-500">{rating.toFixed(1)}</span>
    </div>
  );
}

export function QuizResultCard({
  result,
  rank,
  sendCurrency,
  receiveCurrency,
}: QuizResultCardProps) {
  const isBestMatch = rank === 1;

  return (
    <article
      className={[
        'relative rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md',
        isBestMatch ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200',
      ].join(' ')}
    >
      {/* Best match badge */}
      {isBestMatch && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white shadow-sm">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Best Match
          </span>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-start gap-4">
        {/* Logo */}
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
          <Image
            src={result.logoUrl}
            alt={`${result.name} logo`}
            fill
            sizes="48px"
            className="object-contain p-1"
          />
        </div>

        {/* Name + rating */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-gray-900">{result.name}</h3>
            {result.isVerified && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Regulated
              </span>
            )}
          </div>
          <StarRating rating={result.rating} />
        </div>
      </div>

      {/* Key stats */}
      <dl className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-gray-50 p-3">
        <div className="flex flex-col items-center text-center">
          <dt className="text-xs text-gray-500">Recipient gets</dt>
          <dd className="mt-0.5 text-sm font-bold text-gray-900">
            {result.recipientAmount.toLocaleString(undefined, {
              style: 'currency',
              currency: receiveCurrency,
              maximumFractionDigits: 2,
            })}
          </dd>
        </div>
        <div className="flex flex-col items-center text-center border-x border-gray-200">
          <dt className="text-xs text-gray-500">Total cost</dt>
          <dd className="mt-0.5 text-sm font-bold text-gray-900">
            {result.totalCost.toLocaleString(undefined, {
              style: 'currency',
              currency: sendCurrency,
              maximumFractionDigits: 2,
            })}
          </dd>
        </div>
        <div className="flex flex-col items-center text-center">
          <dt className="text-xs text-gray-500">Speed</dt>
          <dd className="mt-0.5 text-sm font-bold text-gray-900">{result.transferSpeed}</dd>
        </div>
      </dl>

      {/* Promo banner */}
      {result.promoLabel && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2">
          <span className="text-base" aria-hidden="true">🎁</span>
          <span className="text-xs font-medium text-amber-800">{result.promoLabel}</span>
        </div>
      )}

      {/* CTA row */}
      <div className="mt-4 flex items-center gap-3">
        <Link
          href={`/providers/${result.slug}`}
          className="flex-1 rounded-xl border border-gray-200 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          View details
        </Link>
        <a
          href={result.website}
          target="_blank"
          rel="noopener noreferrer"
          className={[
            'flex-1 rounded-xl py-2.5 text-center text-sm font-semibold text-white transition-colors',
            isBestMatch
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-800 hover:bg-gray-900',
          ].join(' ')}
        >
          Send now
          <span className="sr-only"> with {result.name}</span>
        </a>
      </div>
    </article>
  );
}
