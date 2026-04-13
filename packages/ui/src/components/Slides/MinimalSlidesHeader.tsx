import { ButtonRow } from "./ButtonRow"
import type { UseSlideReturn } from "./useSlideState"

interface MinimalSlidesHeaderProps {
  header?: string
  description?: string | React.ReactNode
  connected: boolean
  state: UseSlideReturn
}

export const MinimalSlidesHeader = ({
  header,
  description,
  connected,
  state,
}: MinimalSlidesHeaderProps) => (
  <div className="flex items-center justify-between">
    <div className="flex flex-col gap-1">
      {header && <span className="text-sm font-semibold">{header}</span>}
      {description && <span className="text-muted-text text-xs">{description}</span>}
    </div>
    <ButtonRow
      activeSlide={state.activeSlide}
      connected={connected}
      isCollapsed={state.isCollapsed}
      onSlideChange={state.changeSlide}
      slideKeys={state.slideKeys}
    />
  </div>
)
