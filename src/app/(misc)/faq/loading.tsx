export default function FaqLoading() {
  return (
    <div className="animate-pulse bg-white">
      {/* Header skeleton */}
      <div className="border-b border-gray-100 bg-gray-50 py-16 text-center">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <div className="mx-auto h-9 w-72 rounded-lg bg-gray-200" />
          <div className="mx-auto mt-3 h-4 w-96 rounded bg-gray-200" />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {/* Search skeleton */}
        <div className="mb-6 h-10 w-full rounded-lg bg-gray-100" />

        {/* Category tabs skeleton */}
        <div className="mb-6 flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-20 rounded-full bg-gray-100" />
          ))}
        </div>

        {/* FAQ items skeleton */}
        <div className="divide-y divide-gray-100">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-5">
              <div className="h-5 w-2/3 rounded bg-gray-200" />
              <div className="h-5 w-5 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>

      {/* CTA skeleton */}
      <div className="border-t border-gray-100 bg-gray-50 py-12">
        <div className="mx-auto max-w-xl px-4 text-center">
          <div className="mx-auto h-6 w-48 rounded bg-gray-200" />
          <div className="mx-auto mt-2 h-4 w-64 rounded bg-gray-100" />
          <div className="mx-auto mt-5 h-10 w-32 rounded-lg bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
