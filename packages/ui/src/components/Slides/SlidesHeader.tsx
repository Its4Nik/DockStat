import { CardHeader } from "../Card/CardHeader"
import type { UseSlideReturn } from "./useSlideState"
import { ButtonRow } from "./ButtonRow"

interface SlidesHeaderProps {
  header?: string
  description?: string
  buttonPosition: "left" | "center" | "right"
  connected: boolean
  state: UseSlideReturn
}

export const SlidesHeader = ({
  header,
  description,
  buttonPosition,
  connected,
  state,
}: SlidesHeaderProps) => {
  const isRightPosition = buttonPosition === "right"

  const headerClasses = `transition-all duration-300 ${
    isRightPosition ? "flex flex-row items-center justify-between gap-4" : "flex flex-col gap-4"
  }`

  const headerContent = (
    <div className="flex flex-col gap-1">
      {header && <span className="text-lg font-semibold">{header}</span>}
      {description && <span className="text-muted-text text-sm">{description}</span>}
    </div>
  )

  const buttons = (
    <ButtonRow
      slideKeys={state.slideKeys}
      activeSlide={state.activeSlide}
      isCollapsed={state.isCollapsed}
      connected={connected}
      onSlideChange={state.changeSlide}
      wrapperClass={
        buttonPosition === "right"
          ? ""
          : `flex w-full ${buttonPosition === "center" ? "justify-center" : "justify-start"}`
      }
    />
  )

  return (
    <CardHeader className={headerClasses}>
      {isRightPosition ? (
        <>
          {headerContent}
          {buttons}
        </>
      ) : (
        <>
          {headerContent}
          {buttons}
        </>
      )}
    </CardHeader>
  )
}
