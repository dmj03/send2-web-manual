'use client';

import Link from 'next/link';
import { QuizResultCard } from './QuizResultCard';
import { DESTINATION_OPTIONS, priorityToSortField, type QuizAnswers } from '../types';
import { useQuizResults } from '../hooks/useQuizResults';

interface QuizResultsProps {
  answers: QuizAnswers;
  onRetake: () => void;
}

function ResultsSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading results">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5"
        >
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-gray-200" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-4 w-32 rounded bg-gray-200" />
              <div className="h-3 w-24 rounded bg-gray-100" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-gray-50 p-3">
            {[1, 2, 3].map((j) => (
              <div key={j} className="flex flex-col items-center gap-1">
                <div className="h-2 w-16 rounded bg-gray-200" />
                <div className="h-4 w-20 rounded bg-gray-300" />
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-3">
            <div className="h-10 flex-1 rounded-xl bg-gray-100" />
            <div className="h-10 flex-1 rounded-xl bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function QuizResults({ answers, onRetake }: QuizResultsProps) {
  const { results, isLoading, isError, error, lastUpdated, searchFilters } =
    useQuizResults(answers, true);

  const destInfo = answers.destination
    ? DESTINATION_OPTIONS.find((d) => d.code === answers.destination)
    : null;

  const sendCurrency = answers.amount?.sendCurrency ?? 'GBP';
  const receiveCurrency = destInfo?.currency ?? '';

  // Build a search URL that reflects the quiz answers for the "See all results" link
  const searchParams = searchFilters
    ? new URLSearchParams({
        sendAmount: String(searchFilters.sendAmount),
        sendCurrency: searchFilters.sendCurrency,
        receiveCountry: searchFilters.receiveCountry,
        receiveCurrency: searchFilters.receiveCurrency,
      })
    : null;

  return (
    <section aria-labelledby="quiz-results-heading">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2
              id="quiz-results-heading"
              className="text-xl font-bold text-gray-900 sm:text-2xl"
            >
              Your recommended providers
            </h2>
            {destInfo && answers.amount && (
              <p className="mt-1 text-sm text-gray-500">
                Sending{' '}
                <strong>
                  {answers.amount.sendAmount.toLocaleString()} {sendCurrency}
                </strong>{' '}
                to{' '}
                <strong>
                  {destInfo.flag} {destInfo.name}
                </strong>
              </p>
            )}
            {lastUpdated && (
              <p className="mt-0.5 text-xs text-gray-400">
                Rates updated{' '}
                {new Date(lastUpdated).toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onRetake}
            className="shrink-0 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Retake quiz
          </button>
        </div>
      </div>

      {/* Results */}
      {isLoading && <ResultsSkeleton />}

      {isError && (
        <div
          role="alert"
          className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center"
        >
          <p className="text-sm font-semibold text-red-700">
            Unable to load provider results
          </p>
          <p className="mt-1 text-xs text-red-500">
            {error?.message ?? 'Something went wrong — please try again'}
          </p>
          <button
            type="button"
            onClick={onRetake}
            className="mt-4 rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
          >
            Start over
          </button>
        </div>
      )}

      {!isLoading && !isError && results.length === 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-2xl" aria-hidden="true">🔍</p>
          <p className="mt-2 text-sm font-semibold text-gray-700">No providers found</p>
          <p className="mt-1 text-xs text-gray-500">
            Try adjusting your transfer details
          </p>
          <button
            type="button"
            onClick={onRetake}
            className="mt-4 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isError && results.length > 0 && (
        <>
          <div className="flex flex-col gap-5">
            {results.slice(0, 5).map((result, idx) => (
              <QuizResultCard
                key={result.id}
                result={result}
                rank={idx + 1}
                sendCurrency={sendCurrency}
                receiveCurrency={receiveCurrency}
              />
            ))}
          </div>

          {/* See all CTA */}
          {searchParams && (
            <div className="mt-6 text-center">
              <Link
                href={`/search?${searchParams.toString()}`}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
              >
                See all providers
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          )}
        </>
      )}
    </section>
  );
}
