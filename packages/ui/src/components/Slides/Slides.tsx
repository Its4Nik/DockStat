import { useState, useEffect, useRef } from "react"
import { CardHeader } from "../Card/CardHeader"
import { Card, CardBody } from "../Card/Card"
import { Button } from "../Button/Button"

export type ButtonRowPosition = "left" | "center" | "right"

export interface SlidesProps {
  children: Record<string, React.ReactNode>
  header?: string
  description?: string
  /** Position of the button row: 'left', 'center', or 'right' */
  buttonPosition?: ButtonRowPosition
  /** When true, buttons have no gaps and shared borders (tab-style) */
  connected?: boolean
  /** Default selected slide key */
  defaultSlide?: string
  /** Controlled selected slide key */
  selectedSlide?: string
  /** Callback when slide changes */
  onSlideChange?: (slideKey: string) => void
}

export function Slides({
  children,
  header,
  description,
  buttonPosition = "left",
  connected = false,
  defaultSlide,
  selectedSlide: controlledSlide,
  onSlideChange,
}: SlidesProps) {
  const slideKeys = Object.keys(children)
  const initialSlide = defaultSlide || slideKeys[0] || ""

  const [internalSlide, setInternalSlide] = useState(initialSlide)
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationDirection, setAnimationDirection] = useState<"left" | "right">("right")
  const [displayedSlide, setDisplayedSlide] = useState(initialSlide)
  const previousSlideIndex = useRef(slideKeys.indexOf(initialSlide))

  const isControlled = controlledSlide !== undefined
  const activeSlide = isControlled ? controlledSlide : internalSlide

  const handleSlideChange = (newSlide: string) => {
    if (newSlide === activeSlide || isAnimating) return

    const newIndex = slideKeys.indexOf(newSlide)
    const currentIndex = slideKeys.indexOf(activeSlide)

    setAnimationDirection(newIndex > currentIndex ? "right" : "left")
    previousSlideIndex.current = currentIndex

    setIsAnimating(true)

    setTimeout(() => {
      setDisplayedSlide(newSlide)
      if (!isControlled) {
        setInternalSlide(newSlide)
      }
      onSlideChange?.(newSlide)

      setTimeout(() => {
        setIsAnimating(false)
      }, 300)
    }, 150)
  }

  // Sync displayed slide with controlled prop changes
  useEffect(() => {
    if (isControlled && controlledSlide !== displayedSlide && !isAnimating) {
      const newIndex = slideKeys.indexOf(controlledSlide)
      const currentIndex = slideKeys.indexOf(displayedSlide)
      setAnimationDirection(newIndex > currentIndex ? "right" : "left")
      setIsAnimating(true)

      setTimeout(() => {
        setDisplayedSlide(controlledSlide)
        setTimeout(() => {
          setIsAnimating(false)
        }, 300)
      }, 150)
    }
  }, [controlledSlide, isControlled, displayedSlide, isAnimating, slideKeys])

  const getAnimationClass = () => {
    if (!isAnimating) {
      return "opacity-100 transform translate-x-0"
    }

    // During the exit phase (before content switch)
    if (displayedSlide === activeSlide) {
      return animationDirection === "right"
        ? "animate-[slide-out_0.15s_ease-in_forwards]"
        : "animate-[slide-out-left_0.15s_ease-in_forwards]"
    }

    // During the enter phase (after content switch)
    return animationDirection === "right"
      ? "animate-[slide-in_0.3s_ease-out_forwards]"
      : "animate-[slide-in-left_0.3s_ease-out_forwards]"
  }

  const renderButtonRow = () => (
    <div
      className={`flex ${connected ? "gap-0" : "gap-2"} ${connected ? "rounded-md overflow-hidden" : ""}`}
    >
      {slideKeys.map((key, index) => {
        const isActive = key === activeSlide
        const isFirst = index === 0
        const isLast = index === slideKeys.length - 1

        // Connected style: remove rounding on touching edges
        let connectedClasses = ""
        if (connected) {
          if (isFirst && !isLast) {
            connectedClasses = "rounded-r-none"
          } else if (isLast && !isFirst) {
            connectedClasses = "rounded-l-none"
          } else if (!isFirst && !isLast) {
            connectedClasses = "rounded-none"
          }
          if (!isFirst) {
            connectedClasses += " border-l-0"
          }
        }

        return (
          <Button
            key={key}
            variant={isActive ? "primary" : "secondary"}
            size="sm"
            onClick={() => handleSlideChange(key)}
            className={connectedClasses}
            disabled={isAnimating}
          >
            {key}
          </Button>
        )
      })}
    </div>
  )

  // When buttons are on the right, render header and buttons in the same row
  const isRightPosition = buttonPosition === "right"

  return (
    <Card variant="flat">
      <CardHeader
        className={
          isRightPosition
            ? "flex flex-row items-center justify-between gap-4"
            : "flex flex-col gap-4"
        }
      >
        {isRightPosition ? (
          <>
            {/* Header text on the left */}
            <div className="flex flex-col gap-1">
              {header && <span className="text-lg font-semibold">{header}</span>}
              {description && <span className="text-sm text-muted-text">{description}</span>}
            </div>
            {/* Buttons on the right */}
            {renderButtonRow()}
          </>
        ) : (
          <>
            {/* Header text */}
            <div className="flex flex-col gap-1">
              {header && <span className="text-lg font-semibold">{header}</span>}
              {description && <span className="text-sm text-muted-text">{description}</span>}
            </div>
            {/* Button Row - left or center */}
            <div
              className={`flex ${buttonPosition === "center" ? "justify-center" : "justify-start"} w-full`}
            >
              {renderButtonRow()}
            </div>
          </>
        )}
      </CardHeader>

      <CardBody>
        {/* Slide Content with Animation */}
        <div className={`transition-all duration-300 ${getAnimationClass()}`}>
          {children[displayedSlide]}
        </div>
      </CardBody>
    </Card>
  )
}
