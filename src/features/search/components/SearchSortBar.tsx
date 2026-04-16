'use client';

import type { SortField, SortDirection } from '@/types/search';
import type { ActiveFilters } from '@/features/search/hooks';

interface SortOption {
  field: SortField;
  direction: SortDirection;
  label: string;
}

const SORT_OPTIONS: SortOption[] = [
  { field: 'recipientAmount', direction: 'desc', label: 'Best rate' },
  { field: 'totalCost', direction: 'asc', label: 'Lowest cost' },
  { field: 'transferSpeed', direction: 'asc', label: 'Fastest' },
  { field: 'rating', direction: 'desc', label: 'Top rated' },
];

interface SearchSortBarProps {
  filters: ActiveFilters | null;
  totalCount: number;
  onSort: (field: SortField, direction: SortDirection) => void;
}

export function SearchSortBar({ filters, totalCount, onSort }: SearchSortBarProps) {
  const activeField = filters?.sortField ?? 'recipientAmount';
  const activeDir = filters?.sortDirection ?? 'desc';

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-gray-500">
        {totalCount > 0 ? (
          <>
            <span className="font-semibold text-gray-900">{totalCount}</span>{' '}
            provider{totalCount !== 1 ? 's' : ''} found
          </>
        ) : (
          'Searching…'
        )}
      </p>

      <div
        className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm"
        role="group"
        aria-label="Sort results by"
      >
        {SORT_OPTIONS.map((opt) => {
          const isActive = opt.field === activeField && opt.direction === activeDir;
          return (
            <button
              key={`${opt.field}-${opt.direction}`}
              type="button"
              onClick={() => onSort(opt.field, opt.direction)}
              aria-pressed={isActive}
              className={[
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500',
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100',
              ].join(' ')}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
