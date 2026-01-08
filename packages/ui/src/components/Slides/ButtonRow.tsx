import { Button } from "../Button/Button"
import type { UseSlideReturn } from "./useSlideState"

interface ButtonRowProps extends Pick<UseSlideReturn, "slideKeys" | "activeSlide" | "isCollapsed"> {
  connected: boolean
  onSlideChange: (key: string) => void
  wrapperClass?: string
}

const getButtonClassNames = (index: number, total: number, connected: boolean) => {
  if (!connected) return ""

  const isFirst = index === 0
  const isLast = index === total - 1

  if (isFirst && isLast) return ""
  if (isFirst) return "!rounded-r-none !rounded-l-md"
  if (isLast) return "!rounded-l-none !rounded-r-md border-l-0"
  return "!rounded-none border-l-0"
}

export const ButtonRow = ({
  slideKeys,
  activeSlide,
  isCollapsed,
  connected,
  onSlideChange,
  wrapperClass,
}: ButtonRowProps) => (
  <div
    className={`flex ${connected ? "gap-0" : "gap-2"} ${connected ? "overflow-hidden rounded-md" : ""} ${wrapperClass || ""}`}
  >
    {slideKeys.map((key, index) => {
      const isActive = key === activeSlide && !isCollapsed

      return (
        <Button
          key={key}
          variant={isActive ? "outline" : "primary"}
          size="sm"
          noFocusRing
          onClick={() => onSlideChange(key)}
          className={getButtonClassNames(index, slideKeys.length, connected)}
        >
          {key}
        </Button>
      )
    })}
  </div>
)
