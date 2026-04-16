export default function AccountSettingsLoading() {
  return (
    <div>
      <div className="mb-6 space-y-2">
        <div className="h-8 w-32 animate-pulse rounded-md bg-gray-200" />
        <div className="h-4 w-64 animate-pulse rounded-md bg-gray-200" />
      </div>

      <div className="space-y-6">
        {/* Card skeleton × 2 */}
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            aria-busy="true"
          >
            <div className="mb-4 space-y-2">
              <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-56 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="space-y-4">
              <div className="h-10 w-full animate-pulse rounded-lg bg-gray-200" />
              <div className="h-10 w-full animate-pulse rounded-lg bg-gray-200" />
              <div className="flex justify-end">
                <div className="h-9 w-32 animate-pulse rounded-lg bg-gray-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
