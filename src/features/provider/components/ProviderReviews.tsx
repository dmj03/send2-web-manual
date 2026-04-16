'use client';

import Image from 'next/image';
import { useProviderReviewsQuery } from '@/hooks/providers/useProviderReviewsQuery';
import type { ProviderReview } from '@/hooks/providers/useProviderReviewsQuery';
import { StarRating } from './StarRating';

interface ProviderReviewsProps {
  providerId: string;
  providerName: string;
}

function ReviewCard({ review }: { review: ProviderReview }) {
  const date = new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(review.createdAt));

  return (
    <article className="border-b border-gray-50 pb-6 last:border-0 last:pb-0">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
          {review.userAvatarUrl ? (
            <Image
              src={review.userAvatarUrl}
              alt={review.userName}
              fill
              sizes="36px"
              className="object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-gray-500">
              {review.userName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">{review.userName}</span>
            {review.isVerified && (
              <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                Verified
              </span>
            )}
            <span className="ml-auto text-xs text-gray-400">{date}</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <StarRating rating={review.rating} showLabel size="sm" />
            <span className="text-xs font-medium text-gray-600">{review.rating}/5</span>
          </div>
          {review.title && (
            <p className="mt-2 text-sm font-medium text-gray-800">{review.title}</p>
          )}
          <p className="mt-1 text-sm text-gray-600">{review.body}</p>
        </div>
      </div>
    </article>
  );
}

export function ProviderReviews({ providerId, providerName }: ProviderReviewsProps) {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useProviderReviewsQuery(providerId);

  const allReviews = data?.pages.flatMap((page) => page.reviews) ?? [];
  const totalReviews = data?.pages[0]?.meta.total ?? 0;

  return (
    <div>
      {isLoading && (
        <div className="space-y-6" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse border-b border-gray-50 pb-6">
              <div className="flex gap-3">
                <div className="h-9 w-9 rounded-full bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded bg-gray-100" />
                  <div className="h-3 w-24 rounded bg-gray-100" />
                  <div className="h-3 w-full rounded bg-gray-100" />
                  <div className="h-3 w-4/5 rounded bg-gray-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          Reviews could not be loaded. Please try refreshing the page.
        </p>
      )}

      {!isLoading && !isError && allReviews.length === 0 && (
        <p className="text-sm text-gray-400">
          No reviews yet. Be the first to review {providerName}.
        </p>
      )}

      {allReviews.length > 0 && (
        <>
          {totalReviews > 0 && (
            <p className="mb-6 text-sm text-gray-500">
              Showing {allReviews.length} of {totalReviews.toLocaleString()} reviews
            </p>
          )}
          <div className="space-y-6">
            {allReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>

          {hasNextPage && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {isFetchingNextPage ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
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
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    Loading…
                  </>
                ) : (
                  'Load more reviews'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
