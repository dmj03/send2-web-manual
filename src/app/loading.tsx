export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col animate-pulse" aria-label="Loading…" role="status">
      {/* Header skeleton */}
      <div className="sticky top-0 z-40 h-16 w-full border-b border-border bg-surface px-4">
        <div className="mx-auto flex h-full max-w-7xl items-center gap-4">
          <div className="h-8 w-24 rounded-md bg-border" />
          <div className="hidden flex-1 gap-6 md:flex">
            <div className="h-4 w-14 rounded bg-border" />
            <div className="h-4 w-14 rounded bg-border" />
            <div className="h-4 w-14 rounded bg-border" />
            <div className="h-4 w-14 rounded bg-border" />
          </div>
          <div className="ml-auto h-9 w-24 rounded-full bg-border" />
        </div>
      </div>

      <div className="flex flex-1">
        {/* Sidebar skeleton — desktop only */}
        <aside className="hidden w-60 shrink-0 border-r border-border bg-surface p-4 md:block">
          <div className="space-y-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2">
                <div className="h-5 w-5 rounded bg-border" />
                <div className="h-4 w-24 rounded bg-border" />
              </div>
            ))}
          </div>
        </aside>

        {/* Main content skeleton */}
        <main className="flex-1 p-6">
          {/* Hero / search card */}
          <div className="mb-8 rounded-2xl bg-surface p-8">
            <div className="mx-auto max-w-2xl space-y-4">
              <div className="h-8 w-48 rounded-lg bg-border" />
              <div className="h-5 w-72 rounded bg-border" />
              <div className="mt-6 flex gap-3">
                <div className="h-12 flex-1 rounded-xl bg-border" />
                <div className="h-12 flex-1 rounded-xl bg-border" />
                <div className="h-12 w-32 rounded-xl bg-border" />
              </div>
            </div>
          </div>

          {/* Cards grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-border" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-28 rounded bg-border" />
                    <div className="h-3 w-20 rounded bg-border" />
                  </div>
                </div>
                <div className="h-3 w-full rounded bg-border" />
                <div className="h-3 w-4/5 rounded bg-border" />
                <div className="flex justify-between pt-2">
                  <div className="h-6 w-20 rounded bg-border" />
                  <div className="h-8 w-24 rounded-lg bg-border" />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      <span className="sr-only">Loading page…</span>
    </div>
  )
}
