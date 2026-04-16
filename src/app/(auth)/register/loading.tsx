export default function RegisterLoading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Loading registration form">
      {/* Heading */}
      <div className="space-y-2">
        <div className="h-7 w-40 rounded-md bg-gray-200" />
        <div className="h-4 w-64 rounded-md bg-gray-100" />
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <div className="h-4 w-20 rounded bg-gray-200" />
        <div className="h-10 rounded-lg bg-gray-100" />
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <div className="h-4 w-28 rounded bg-gray-200" />
        <div className="h-10 rounded-lg bg-gray-100" />
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <div className="h-4 w-20 rounded bg-gray-200" />
        <div className="h-10 rounded-lg bg-gray-100" />
      </div>

      {/* Confirm password */}
      <div className="space-y-1.5">
        <div className="h-4 w-32 rounded bg-gray-200" />
        <div className="h-10 rounded-lg bg-gray-100" />
      </div>

      {/* Referral code */}
      <div className="space-y-1.5">
        <div className="h-4 w-24 rounded bg-gray-200" />
        <div className="h-10 rounded-lg bg-gray-100" />
      </div>

      {/* Terms checkbox */}
      <div className="flex items-center gap-3">
        <div className="h-4 w-4 rounded bg-gray-200" />
        <div className="h-4 w-64 rounded bg-gray-100" />
      </div>

      {/* Button */}
      <div className="h-10 rounded-lg bg-blue-100" />
    </div>
  );
}
