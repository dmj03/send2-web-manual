interface SearchResultsSkeletonProps {
  count?: number;
}

export function SearchResultsSkeleton({ count = 5 }: SearchResultsSkeletonProps) {
  return (
    <ul className="space-y-3" aria-label="Loading results" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <li
          key={i}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start gap-4">
            {/* Logo */}
            <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-gray-200" />

            <div className="flex-1 space-y-2">
              {/* Provider name */}
              <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
              {/* Rating */}
              <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
            </div>

            {/* Rate / amount */}
            <div className="hidden flex-col items-end gap-1 sm:flex">
              <div className="h-6 w-28 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
            </div>

            {/* Fee / speed */}
            <div className="hidden flex-col items-end gap-1 md:flex">
              <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
            </div>

            {/* CTA */}
            <div className="h-10 w-24 animate-pulse rounded-xl bg-gray-200" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function CompareTableSkeleton() {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="p-4 text-left">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
            </th>
            {[1, 2, 3].map((i) => (
              <th key={i} className="p-4">
                <div className="mx-auto h-12 w-12 animate-pulse rounded-xl bg-gray-200" />
                <div className="mx-auto mt-2 h-4 w-20 animate-pulse rounded bg-gray-200" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, row) => (
            <tr key={row} className="border-b border-gray-100">
              <td className="p-4">
                <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
              </td>
              {[1, 2, 3].map((col) => (
                <td key={col} className="p-4 text-center">
                  <div className="mx-auto h-4 w-20 animate-pulse rounded bg-gray-200" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
