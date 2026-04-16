export function ProviderDetailSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Hero */}
      <div className="border-b border-gray-100 bg-white pb-8 pt-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-6 flex items-center gap-2">
            <div className="h-3.5 w-10 rounded bg-gray-100" />
            <div className="h-3.5 w-2 rounded bg-gray-100" />
            <div className="h-3.5 w-16 rounded bg-gray-100" />
            <div className="h-3.5 w-2 rounded bg-gray-100" />
            <div className="h-3.5 w-24 rounded bg-gray-200" />
          </div>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-5">
              <div className="h-16 w-32 rounded-xl bg-gray-100" />
              <div className="space-y-2">
                <div className="h-7 w-48 rounded bg-gray-200" />
                <div className="h-4 w-32 rounded bg-gray-100" />
                <div className="h-4 w-64 rounded bg-gray-100" />
                <div className="flex gap-2">
                  <div className="h-5 w-20 rounded-full bg-gray-100" />
                  <div className="h-5 w-20 rounded-full bg-gray-100" />
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="h-10 w-36 rounded-xl bg-gray-100" />
              <div className="h-8 w-28 rounded-lg bg-gray-100" />
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main */}
          <div className="space-y-8 lg:col-span-2">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 h-5 w-32 rounded bg-gray-200" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-4 rounded bg-gray-100" />
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 h-5 w-36 rounded bg-gray-200" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-6 w-24 rounded-lg bg-gray-100" />
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-6 h-5 w-40 rounded bg-gray-200" />
              <div className="space-y-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3 border-b border-gray-50 pb-6">
                    <div className="h-9 w-9 rounded-full bg-gray-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 rounded bg-gray-100" />
                      <div className="h-3 w-24 rounded bg-gray-100" />
                      <div className="h-3 w-full rounded bg-gray-100" />
                      <div className="h-3 w-4/5 rounded bg-gray-100" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 h-5 w-28 rounded bg-gray-200" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-4 w-24 rounded bg-gray-100" />
                    <div className="h-4 w-12 rounded bg-gray-100" />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 h-5 w-32 rounded bg-gray-200" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-gray-100" />
                    <div className="h-4 w-28 rounded bg-gray-100" />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-blue-50 bg-blue-50/50 p-5">
              <div className="mb-3 h-4 w-20 rounded bg-blue-100" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 w-16 rounded bg-blue-100" />
                    <div className="h-4 w-12 rounded bg-blue-100" />
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
