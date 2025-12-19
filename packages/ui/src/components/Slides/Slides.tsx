import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { Button } from "../Button/Button"
import { Card, CardBody } from "../Card/Card"
import { CardHeader } from "../Card/CardHeader"

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
  onSlideChange?: (slideKey: string | null) => void
  /** When true, clicking the active slide button will hide/collapse the content */
  hideable?: boolean

  className?: string
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
  hideable = false,
  className = "",
}: SlidesProps) {
  const slideKeys = Object.keys(children)
  const initialSlide = hideable ? null : defaultSlide || slideKeys[0] || ""

  const [internalSlide, setInternalSlide] = useState<string | null>(initialSlide)
  const [animationDirection, setAnimationDirection] = useState<1 | -1>(1)
  const [isCollapsed, setIsCollapsed] = useState(hideable)
  const previousSlideIndex = useRef(slideKeys.indexOf(initialSlide || ""))

  const isControlled = controlledSlide !== undefined
  const activeSlide = isControlled ? controlledSlide : internalSlide

  const handleSlideChange = (newSlide: string) => {
    // If hideable and clicking the same slide, collapse it
    if (hideable && newSlide === activeSlide) {
      setIsCollapsed(true)
      if (!isControlled) {
        setInternalSlide(null)
      }
      onSlideChange?.(null)
      return
    }

    // If currently collapsed, expand with the new slide
    if (isCollapsed || activeSlide === null) {
      setIsCollapsed(false)
      setAnimationDirection(1)
      if (!isControlled) {
        setInternalSlide(newSlide)
      }
      onSlideChange?.(newSlide)
      return
    }

    // Normal slide change
    if (newSlide === activeSlide) return

    const newIndex = slideKeys.indexOf(newSlide)
    const currentIndex = slideKeys.indexOf(activeSlide)

    setAnimationDirection(newIndex > currentIndex ? 1 : -1)
    previousSlideIndex.current = currentIndex

    if (!isControlled) {
      setInternalSlide(newSlide)
    }
    onSlideChange?.(newSlide)
  }

  // Sync displayed slide with controlled prop changes
  useEffect(() => {
    if (isControlled && controlledSlide !== activeSlide) {
      if (controlledSlide === null || controlledSlide === undefined) {
        setIsCollapsed(true)
        return
      }

      const newIndex = slideKeys.indexOf(controlledSlide)
      const currentIndex = slideKeys.indexOf(activeSlide || "")
      setAnimationDirection(newIndex > currentIndex ? 1 : -1)
      setIsCollapsed(false)
    }
  }, [controlledSlide, isControlled, activeSlide, slideKeys])

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -100 : 100,
      opacity: 0,
    }),
  }

  const collapseVariants = {
    collapsed: {
      height: 0,
      opacity: 0,
      padding: 0,
    },
    expanded: {
      height: "auto",
      opacity: 1,
    },
  }

  const renderButtonRow = () => (
    <div
      className={`flex ${connected ? "gap-0" : "gap-2"} ${connected ? "rounded-md overflow-hidden" : ""}`}
    >
      {slideKeys.map((key, index) => {
        const isActive = key === activeSlide && !isCollapsed
        const isFirst = index === 0
        const isLast = index === slideKeys.length - 1

        // Connected style: use explicit rounding classes to override the Button's default rounded-md
        // We use !important-style explicit classes to ensure they win over the base rounded-md
        let connectedClasses = ""
        if (connected) {
          if (isFirst && isLast) {
            // Single button - keep default rounding
            connectedClasses = ""
          } else if (isFirst) {
            // First button - round left only
            connectedClasses = "!rounded-r-none !rounded-l-md"
          } else if (isLast) {
            // Last button - round right only
            connectedClasses = "!rounded-l-none !rounded-r-md border-l-0"
          } else {
            // Middle buttons - no rounding
            connectedClasses = "!rounded-none border-l-0"
          }
        }

        return (
          <Button
            key={key}
            variant={isActive ? "primary" : "secondary"}
            size="sm"
            noFocusRing
            onClick={() => handleSlideChange(key)}
            className={connectedClasses}
          >
            {key}
          </Button>
        )
      })}
    </div>
  )

  // When buttons are on the right, render header and buttons in the same row
  const isRightPosition = buttonPosition === "right"

  // Check if we should show the CardBody at all
  const hasContent =
    activeSlide && children[activeSlide] !== null && children[activeSlide] !== undefined

  const show = hasContent || !isCollapsed

  const headerClasses = `${!show && "border-b-0! py-0!"} transition-all duration-300 ${
    isRightPosition ? "flex flex-row items-center justify-between gap-4" : "flex flex-col gap-4"
  }`

  return (
    <Card variant="flat" className={className}>
      <CardHeader className={headerClasses}>
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

      {/* Only render CardBody if there's content to show or we're animating */}
      <AnimatePresence initial={false}>
        {show && (
          <motion.div
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={collapseVariants}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <CardBody className="overflow-hidden">
              {/* Slide Content with Animation */}
              <AnimatePresence initial={false} custom={animationDirection} mode="wait">
                {activeSlide && !isCollapsed && (
                  <motion.div
                    key={activeSlide}
                    custom={animationDirection}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: "spring", stiffness: 300, damping: 30 },
                      opacity: { duration: 0.2 },
                    }}
                  >
                    {children[activeSlide]}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardBody>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
