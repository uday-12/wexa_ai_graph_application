export default function ErrorState({
  message = "We can't reach the graph database right now.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-xl text-rose-500">
        !
      </div>
      <p className="font-medium text-rose-900">Something went wrong</p>
      <p className="mt-1 max-w-sm text-sm text-rose-700">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-md bg-rose-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-rose-700"
        >
          Try again
        </button>
      )}
    </div>
  );
}
