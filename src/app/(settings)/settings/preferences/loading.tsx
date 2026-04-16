export default function PreferencesLoading() {
  return (
    <div>
      <div className="mb-6 space-y-2">
        <div className="h-8 w-32 animate-pulse rounded-md bg-gray-200" />
        <div className="h-4 w-72 animate-pulse rounded-md bg-gray-200" />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm" aria-busy="true">
        <div className="space-y-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
              <div className="h-10 w-full animate-pulse rounded-lg bg-gray-200" />
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <div className="h-9 w-32 animate-pulse rounded-lg bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
