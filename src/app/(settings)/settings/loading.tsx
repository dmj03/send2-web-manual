export default function SettingsLoading() {
  return (
    <div>
      {/* Heading skeleton */}
      <div className="mb-8 space-y-2">
        <div className="h-8 w-32 animate-pulse rounded-md bg-gray-200" />
        <div className="h-4 w-72 animate-pulse rounded-md bg-gray-200" />
      </div>

      {/* Section card skeletons */}
      <ul className="space-y-3" aria-busy="true" aria-label="Loading settings">
        {Array.from({ length: 5 }).map((_, i) => (
          <li
            key={i}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="h-12 w-12 shrink-0 animate-pulse rounded-lg bg-gray-200" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-64 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="h-5 w-5 shrink-0 animate-pulse rounded bg-gray-200" />
          </li>
        ))}
      </ul>
    </div>
  );
}
