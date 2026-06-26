import { extractEdenError } from "@dockstat/utils"

export function SignInError({ onRetry, error }: { onRetry: () => void; error: string }) {
  return (
    <div className="py-10 flex flex-col items-center gap-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
      <p className="text-md text-red-300/80">{extractEdenError(error)}</p>
      <button
        className="px-5 py-2 rounded-lg text-md font-medium text-red-300/70 border border-red-500/20 hover:bg-red-500/10 transition-colors"
        onClick={onRetry}
        type="button"
      >
        Retry
      </button>
    </div>
  )
}
