export default function CookiePolicyLoading() {
  return (
    <div className="animate-pulse bg-white">
      <div className="border-b border-gray-100 bg-gray-50 py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="h-9 w-48 rounded-lg bg-gray-200" />
          <div className="mt-3 flex gap-6">
            <div className="h-4 w-36 rounded bg-gray-200" />
            <div className="h-4 w-28 rounded bg-gray-200" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-4/5 rounded bg-gray-200" />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="mb-10 h-40 rounded-xl bg-gray-100" />
        <div className="space-y-10">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-6 w-48 rounded bg-gray-200" />
              <div className="h-4 w-full rounded bg-gray-100" />
              <div className="h-4 w-4/5 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
