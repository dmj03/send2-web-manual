export default function ProtectedLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      {/* Page skeleton for authenticated pages */}
      <div className="w-full max-w-4xl animate-pulse space-y-4 px-4">
        {/* Heading placeholder */}
        <div className="h-8 w-48 rounded-lg bg-gray-200" />
        {/* Content placeholders */}
        <div className="h-4 w-full rounded bg-gray-200" />
        <div className="h-4 w-5/6 rounded bg-gray-200" />
        <div className="h-4 w-4/6 rounded bg-gray-200" />
        {/* Card row placeholders */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    </div>
  );
}
