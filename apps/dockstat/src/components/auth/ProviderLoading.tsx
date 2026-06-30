import { Loader2 } from "lucide-react"

export function ProvidersLoading() {
  return (
    <div className="py-12 flex flex-col items-center gap-4">
      <Loader2
        className="animate-spin text-indigo-400/70"
        size={24}
      />
      <p className="text-sm text-white/30">Loading authentication providers...</p>
    </div>
  )
}
