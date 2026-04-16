'use client';

import { SearchHistoryList } from '@/features/profile/components/SearchHistoryList';

export default function SearchHistoryPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Search history</h1>
        <p className="mt-1 text-sm text-gray-500">
          Your recent exchange rate searches — tap &quot;Repeat&quot; to search again.
        </p>
      </div>
      <SearchHistoryList />
    </div>
  );
}
