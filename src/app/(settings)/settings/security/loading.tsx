export default function SecuritySettingsLoading() {
  return (
    <div>
      <div className="mb-6 space-y-2">
        <div className="h-8 w-28 animate-pulse rounded-md bg-gray-200" />
        <div className="h-4 w-80 animate-pulse rounded-md bg-gray-200" />
      </div>

      <div className="space-y-6" aria-busy="true">
        {/* 2FA card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-5 w-44 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-64 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="h-6 w-11 animate-pulse rounded-full bg-gray-200" />
          </div>
        </div>

        {/* Sessions card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 space-y-2">
            <div className="h-5 w-36 animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-56 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <div className="space-y-1">
                  <div className="h-3.5 w-48 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
                </div>
                <div className="h-7 w-16 animate-pulse rounded-md bg-gray-200" />
              </div>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="rounded-xl border border-red-200 bg-white p-6 shadow-sm">
          <div className="mb-4 space-y-2">
            <div className="h-5 w-28 animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-72 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="h-9 w-40 animate-pulse rounded-lg bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
