export default function PrivacySettingsLoading() {
  return (
    <div>
      <div className="mb-6 space-y-2">
        <div className="h-8 w-44 animate-pulse rounded-md bg-gray-200" />
        <div className="h-4 w-72 animate-pulse rounded-md bg-gray-200" />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm" aria-busy="true">
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-44 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-full max-w-sm animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200" />
              </div>
              <div className="h-6 w-11 shrink-0 animate-pulse rounded-full bg-gray-200" />
            </div>
          ))}

          <div className="border-t border-gray-100 pt-4">
            <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
            <div className="mt-1.5 h-3 w-2/3 animate-pulse rounded bg-gray-200" />
          </div>

          <div className="flex justify-end">
            <div className="h-9 w-32 animate-pulse rounded-lg bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
