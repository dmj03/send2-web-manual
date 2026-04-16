/**
 * Quiz page loading skeleton.
 *
 * Mirrors the QuizContainer card shape: a slim progress bar, a question
 * title block, and 4 option card placeholders.
 *
 * Also exported as `QuizPageSkeleton` so the page can use it inside Suspense.
 */
export function QuizPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-xl animate-pulse">
      {/* Hero placeholder */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="h-7 w-72 rounded-full bg-gray-200" />
        <div className="h-4 w-56 rounded-full bg-gray-100" />
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Progress bar area */}
        <div className="border-b border-gray-100 px-6 pt-6 pb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="h-3 w-20 rounded-full bg-gray-200" />
            <div className="h-3 w-16 rounded-full bg-gray-100" />
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100">
            <div className="h-2 w-1/5 rounded-full bg-gray-300" />
          </div>
          {/* Step dots */}
          <div className="mt-4 hidden sm:flex justify-between">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={[
                    'h-8 w-8 rounded-full',
                    i === 1 ? 'bg-gray-300' : 'bg-gray-100',
                  ].join(' ')}
                />
                <div className="h-2 w-14 rounded-full bg-gray-100" />
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {/* Question title */}
          <div className="mb-6 space-y-2">
            <div className="h-6 w-3/4 rounded-full bg-gray-200" />
            <div className="h-4 w-1/2 rounded-full bg-gray-100" />
          </div>

          {/* Option cards */}
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-start gap-4 rounded-xl border-2 border-gray-100 bg-gray-50 p-4"
              >
                <div className="h-10 w-10 shrink-0 rounded-lg bg-gray-200" />
                <div className="flex-1 space-y-1.5 pt-0.5">
                  <div className="h-3.5 w-28 rounded-full bg-gray-200" />
                  <div className="h-3 w-40 rounded-full bg-gray-100" />
                </div>
                <div className="h-5 w-5 shrink-0 rounded-full bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trust note */}
      <div className="mt-4 flex justify-center">
        <div className="h-3 w-64 rounded-full bg-gray-100" />
      </div>
    </div>
  );
}

/** Default export consumed by Next.js file-based loading.tsx convention. */
export default function QuizLoading() {
  return <QuizPageSkeleton />;
}
