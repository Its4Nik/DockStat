import { X } from "lucide-react"
import DockStatLogo from "../../public/DockStat2-06.png"
import { Button } from "../components/Button/Button"
import { CardHeader } from "../components/Card/Card"
import { Divider } from "../components/Divider/Divider"
import { HoverBubble } from "../components/HoverBubble/HoverBubble"

export const OnboardingHeader = ({ onSkip }: { onSkip: () => void }) => (
  <>
    <CardHeader className="flex items-center justify-between gap-4 px-4 sm:px-6 py-2">
      <div className="flex items-center gap-4">
        <img src={DockStatLogo} className="w-20 h-20" alt="DockStat Logo" />
        <div>
          <h3 className="text-base text-left sm:text-lg font-semibold">DockStat</h3>
          <p className="text-xs sm:text-sm text-slate-400">
            The next generation of container orchestration
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <HoverBubble label="Skip Onboarding?" position="left">
          <Button variant="outline" onClick={onSkip} aria-label="Skip onboarding" size="sm">
            <X className="w-4 h-4" />
          </Button>
        </HoverBubble>
      </div>
    </CardHeader>
    <Divider />
  </>
)
