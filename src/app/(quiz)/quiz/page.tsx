import type { Metadata } from 'next';
import { Suspense } from 'react';
import { QuizContainer } from '@/features/quiz/components/QuizContainer';
import { QuizPageSkeleton } from './loading';

export const metadata: Metadata = {
  title: 'Find Your Best Provider',
  description:
    'Answer 5 quick questions to get personalised money transfer provider recommendations based on your amount, destination, and priorities.',
  openGraph: {
    title: 'Find Your Best Money Transfer Provider | Send2',
    description:
      'Personalised provider recommendations in 60 seconds. Compare fees, exchange rates, and speed.',
    type: 'website',
  },
};

/**
 * Quiz page — CSR only.
 *
 * The wizard is fully client-driven (multi-step state, live API calls for
 * results). The server shell renders metadata and the initial skeleton;
 * QuizContainer takes over from there.
 */
export default function QuizPage() {
  return (
    <>
      {/* Page hero */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
          Find your perfect money transfer provider
        </h1>
        <p className="mt-2 text-base text-gray-500 max-w-md mx-auto">
          Answer 5 quick questions and we&apos;ll show you the best providers
          for your specific transfer.
        </p>
      </div>

      {/* Quiz wizard */}
      <Suspense fallback={<QuizPageSkeleton />}>
        <QuizContainer />
      </Suspense>
    </>
  );
}
