import type { ProvidersTable } from "@dockstat/auth/types"
import { Card } from "@dockstat/ui"
import { ArrowRight } from "lucide-react"
import { getProviderLogo } from "./getProviderLogo"

export function ProviderList({
  providers,
  onSelect,
}: {
  providers: ProvidersTable[]
  onSelect: (id: string) => void
}) {
  if (providers.length === 0) {
    return (
      <div className="py-4 text-center">
        <p className="text-sm text-white/30">No SSO providers found. Configure in the Settings</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-2.5 mb-4 max-h-60 overflow-y-scroll">
      {providers.map((provider) => {
        const info = getProviderLogo(provider.issuer_url, provider.icon || "")
        return (
          <Card
            className="provider-card px-5 py-4"
            glass
            key={provider.id}
            onClick={() => onSelect(provider.id)}
            tabIndex={0}
          >
            <div className="relative z-10 flex items-center gap-4">
              <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-linear-to-br from-indigo-500/20 to-purple-500/10 border border-indigo-500/20 text-white font-bold text-sm">
                <info.icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white/90 truncate">{info.name}</h3>
                <p className="text-xs truncate mt-0.5 font-mono text-white/25">
                  {new URL(provider.issuer_url).hostname}
                </p>
              </div>
              <ArrowRight
                className="provider-arrow shrink-0 text-white/15"
                size={16}
              />
            </div>
          </Card>
        )
      })}
    </div>
  )
}
