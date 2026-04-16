export default function AuthLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
          role="status"
          aria-label="Loading"
        />
        <p className="text-sm text-gray-500">Loading&hellip;</p>
      </div>
    </div>
  );
}
