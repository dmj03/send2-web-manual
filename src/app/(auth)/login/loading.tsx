export default function LoginLoading() {
  return (
    <div className="animate-pulse space-y-5" aria-busy="true" aria-label="Loading sign in form">
      {/* Heading skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-40 rounded-md bg-gray-200" />
        <div className="h-4 w-56 rounded-md bg-gray-100" />
      </div>

      {/* Email field skeleton */}
      <div className="space-y-1.5">
        <div className="h-4 w-28 rounded bg-gray-200" />
        <div className="h-10 rounded-lg bg-gray-100" />
      </div>

      {/* Password field skeleton */}
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <div className="h-4 w-20 rounded bg-gray-200" />
          <div className="h-4 w-24 rounded bg-gray-100" />
        </div>
        <div className="h-10 rounded-lg bg-gray-100" />
      </div>

      {/* Button skeleton */}
      <div className="h-10 rounded-lg bg-blue-100" />

      {/* Footer link skeleton */}
      <div className="flex justify-center gap-2">
        <div className="h-4 w-32 rounded bg-gray-100" />
        <div className="h-4 w-24 rounded bg-blue-100" />
      </div>
    </div>
  );
}
