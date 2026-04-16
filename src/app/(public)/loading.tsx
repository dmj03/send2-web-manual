export default function PublicLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
