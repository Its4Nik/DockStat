import { Card, CardBody } from "../Card/Card"
import { MinimalSlidesHeader } from "./MinimalSlidesHeader"
import { SlideContent } from "./SlideContent"
import { SlidesHeader } from "./SlidesHeader"
import type { SlidesProps } from "./types"
import { useSlidesState } from "./useSlideState"

export function Slides({
  children,
  header,
  description,
  buttonPosition = "left",
  connected = false,
  defaultSlide,
  selectedSlide: controlledSlide,
  onSlideChange,
  hideable = false,
  variant = "default",
  className = "",
}: SlidesProps) {
  const state = useSlidesState({ children, controlledSlide, defaultSlide, hideable, onSlideChange })

  if (variant === "minimal") {
    return (
      <div className={`flex flex-col ${className}`}>
        <MinimalSlidesHeader
          header={header}
          description={description}
          connected={connected}
          state={state}
        />
        <SlideContent state={state}>{children}</SlideContent>
      </div>
    )
  }

  return (
    <Card variant="flat" className={className}>
      <SlidesHeader
        header={header}
        description={description}
        buttonPosition={buttonPosition}
        connected={connected}
        state={state}
      />
      <CardBody className="">
        <SlideContent state={state}>{children}</SlideContent>
      </CardBody>
    </Card>
  )
}
