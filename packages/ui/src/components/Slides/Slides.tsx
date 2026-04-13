import { Card, CardBody } from "../Card/Card"
import { MinimalSlidesHeader } from "./MinimalSlidesHeader"
import { SlideContent } from "./SlideContent"
import { SlidesHeader } from "./SlidesHeader"
import type { SlidesProps } from "./types"
import { useSlidesState } from "./useSlideState"

export type { ButtonRowPosition, SlidesProps, SlideVariant } from "./types"

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
          connected={connected}
          description={description}
          header={header}
          state={state}
        />
        <SlideContent state={state}>{children}</SlideContent>
      </div>
    )
  }

  return (
    <Card
      className={className}
      variant="flat"
    >
      <SlidesHeader
        buttonPosition={buttonPosition}
        connected={connected}
        description={description}
        header={header}
        state={state}
      />
      <CardBody className="">
        <SlideContent state={state}>{children}</SlideContent>
      </CardBody>
    </Card>
  )
}
