export function ProvidersError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="py-10 flex flex-col items-center gap-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
      <p className="text-sm text-red-300/80">Failed to load authentication providers</p>
      <button
        className="px-5 py-2 rounded-lg text-sm font-medium text-red-300/70 border border-red-500/20 hover:bg-red-500/10 transition-colors"
        onClick={onRetry}
        type="button"
      >
        Retry
      </button>
    </div>
  )
}
