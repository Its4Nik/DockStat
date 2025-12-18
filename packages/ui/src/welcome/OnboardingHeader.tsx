import { X } from "lucide-react"
import DockStatLogo from "../../public/DockStat2-06.png"
import { Button } from "../components/Button/Button"
import { CardHeader } from "../components/Card/Card"
import { Divider } from "../components/Divider/Divider"
import { HoverBubble } from "../components/HoverBubble/HoverBubble"

export const OnboardingHeader = ({ onSkip }: { onSkip: () => void }) => (
  <>
    <CardHeader className="flex items-center justify-between gap-6 px-8 py-5">
      <div className="flex items-center gap-5">
        <div className="flex-shrink-0">
          <img src={DockStatLogo} className="w-16 h-16" alt="DockStat Logo" />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-bold tracking-tight">DockStat</h3>
          <p className="text-sm text-slate-400 leading-tight">
            The next generation of container orchestration
          </p>
        </div>
      </div>

      <div className="flex-shrink-0">
        <HoverBubble label="Skip Onboarding" position="left">
          <Button variant="outline" onClick={onSkip} aria-label="Skip onboarding" size="sm">
            <X className="w-4 h-4" />
          </Button>
        </HoverBubble>
      </div>
    </CardHeader>
    <Divider />
  </>
)
