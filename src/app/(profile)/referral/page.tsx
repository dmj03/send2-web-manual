'use client';

import { ReferralCard } from '@/features/profile/components/ReferralCard';

export default function ReferralPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Refer a friend</h1>
        <p className="mt-1 text-sm text-gray-500">
          Share your code and earn rewards every time a friend signs up and transfers money.
        </p>
      </div>
      <ReferralCard />
    </div>
  );
}
