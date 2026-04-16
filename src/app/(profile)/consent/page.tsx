'use client';

import { ConsentToggleForm } from '@/features/profile/components/ConsentToggleForm';

export default function ConsentPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Privacy &amp; consent</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your marketing preferences and data rights.
        </p>
      </div>
      <ConsentToggleForm />
    </div>
  );
}
