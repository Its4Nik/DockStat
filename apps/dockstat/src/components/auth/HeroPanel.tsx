import { Activity, Boxes, Container, Network } from "lucide-react"
// @ts-expect-error
import DockStatLogo from "@/assets/DockStat-wide-white.png"
import { FeaturePill } from "./FeaturePill"

export function HeroPanel() {
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

      <div className="relative z-10 max-w-lg">
        <p className="text-lg leading-relaxed text-white/60 mb-10 slide-l-d3 max-w-md">
          A unified platform for container administration, real‑time infrastructure monitoring, and
          extensible plugin architecture.
        </p>

        <div className="space-y-3 slide-l-d4">
          <FeaturePill
            delay={0.3}
            icon={Container}
            label="Full container & stack lifecycle management"
          />
          <FeaturePill
            delay={0.4}
            icon={Activity}
            label="Real-time monitoring with graph visualizations"
          />
          <FeaturePill
            delay={0.5}
            icon={Boxes}
            label="Runtime plugin system & DockStore marketplace"
          />
          <FeaturePill
            delay={0.6}
            icon={Network}
            label="Multi-node Docker host orchestration"
          />
        </div>
      </div>
    </div>
  )
}
