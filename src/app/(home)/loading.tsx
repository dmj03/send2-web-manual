export default function HomeLoading() {
  return (
    <>
      {/* Hero skeleton */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 pb-16 pt-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl space-y-4 text-center">
            <div className="mx-auto h-12 w-3/4 animate-pulse rounded-lg bg-blue-500/40" />
            <div className="mx-auto h-8 w-2/3 animate-pulse rounded-lg bg-blue-500/40" />
            <div className="mx-auto h-5 w-1/2 animate-pulse rounded-md bg-blue-500/30" />
          </div>
          {/* Search form skeleton */}
          <div className="mt-10 rounded-2xl bg-white/10 p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-white/20" />
              ))}
            </div>
            <div className="mt-4 h-12 animate-pulse rounded-xl bg-white/20" />
          </div>
        </div>
      </section>

      {/* Trust bar skeleton */}
      <section className="border-b border-gray-100 bg-white py-5">
        <div className="mx-auto flex max-w-5xl justify-center gap-10 px-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 w-40 animate-pulse rounded bg-gray-200" />
          ))}
        </div>
      </section>

      {/* Promos skeleton */}
      <section className="bg-gray-50 py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 flex-1 animate-pulse rounded-xl bg-gray-200" />
            ))}
          </div>
        </div>
      </section>

      {/* Featured providers skeleton */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 h-8 w-56 animate-pulse rounded-lg bg-gray-200" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
