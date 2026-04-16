import type { Metadata } from 'next';
import { ComparePageContainer } from '@/features/search/components';

export const metadata: Metadata = {
  title: 'Compare Providers Side-by-Side',
  description:
    'Compare up to 3 money transfer providers side-by-side. See fees, rates, and delivery times at a glance.',
};

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <ComparePageContainer />
    </div>
  );
}
