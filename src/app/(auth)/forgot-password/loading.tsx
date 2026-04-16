export default function ForgotPasswordLoading() {
  return (
    <div className="animate-pulse space-y-5" aria-busy="true" aria-label="Loading forgot password form">
      <div className="space-y-2">
        <div className="h-7 w-44 rounded-md bg-gray-200" />
        <div className="h-4 w-72 rounded-md bg-gray-100" />
      </div>
      <div className="space-y-1.5">
        <div className="h-4 w-28 rounded bg-gray-200" />
        <div className="h-10 rounded-lg bg-gray-100" />
      </div>
      <div className="h-10 rounded-lg bg-blue-100" />
      <div className="mx-auto h-4 w-28 rounded bg-gray-100" />
    </div>
  );
}
