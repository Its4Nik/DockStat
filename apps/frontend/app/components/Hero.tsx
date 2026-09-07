import DockStatLogo from "~/assets/DockStat-wide-white.png"
import { Card } from "@dockstat/ui"

export function HeroPanel({
  error,
  success
}: {
    error: string | boolean
  success: string | boolean
}) {
  return (
    <div className="hero-panel relative hidden lg:flex flex-col w-[52%] min-h-screen p-12 xl:p-16 overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-6 slide-l">
          <div className="relative">
            <div className="logo-ring-outer" />
            <div className="logo-ring" />
            <img
              alt="DockStat"
              src={DockStatLogo}
            />
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-lg space-y-4">
        <Card glass>
          <p className="text-lg leading-relaxed text-white/60 slide-l-d3 max-w-md">
            A unified platform for container administration, real‑time infrastructure monitoring, and
            extensible plugin architecture.
            </p>
        </Card>

        {typeof error === "string" && error && (
          <Card variant="error">{error}</Card>
        )}

        {typeof success === "string" && success && (
          <Card variant="success">{success}</Card>
        )}

      </div>
    </div>
  )
}
