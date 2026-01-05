import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { Button } from "../Button/Button"
import { Card, CardBody } from "../Card/Card"
import { CardHeader } from "../Card/CardHeader"

export type ButtonRowPosition = "left" | "center" | "right"
export type SlideVariant = "default" | "minimal"

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
  /** Visual variant: 'default' (Card wrapper) or 'minimal' (barebones) */
  variant?: SlideVariant

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
  variant = "default",
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
    if (hideable && newSlide === activeSlide) {
      setIsCollapsed(true)
      if (!isControlled) {
        setInternalSlide(null)
      }
      onSlideChange?.(null)
      return
    }

    if (isCollapsed || activeSlide === null) {
      setIsCollapsed(false)
      setAnimationDirection(1)
      if (!isControlled) {
        setInternalSlide(newSlide)
      }
      onSlideChange?.(newSlide)
      return
    }

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

  // Variants for the container collapse
  const collapseVariants = {
    collapsed: {
      height: 0,
      opacity: 0,
      marginBottom: 0,
    },
    expanded: {
      height: "auto",
      opacity: 1,
      // Only add margin if not minimal
      marginBottom: variant === "minimal" ? 0 : undefined,
    },
  }

  const renderButtonRow = () => (
    <div
      className={`flex ${
        connected ? "gap-0" : "gap-2"
      } ${connected ? "rounded-md overflow-hidden" : ""}`}
    >
      {slideKeys.map((key, index) => {
        const isActive = key === activeSlide && !isCollapsed
        const isFirst = index === 0
        const isLast = index === slideKeys.length - 1

        let connectedClasses = ""
        if (connected) {
          if (isFirst && isLast) {
            connectedClasses = ""
          } else if (isFirst) {
            connectedClasses = "!rounded-r-none !rounded-l-md"
          } else if (isLast) {
            connectedClasses = "!rounded-l-none !rounded-r-md border-l-0"
          } else {
            connectedClasses = "!rounded-none border-l-0"
          }
        }

        return (
          <Button
            key={key}
            variant={isActive ? "outline" : "primary"}
            size={variant === "minimal" ? "sm" : "sm"}
            noFocusRing
            onClick={() => handleSlideChange(key)}
            className={`${connectedClasses} `}
          >
            {key}
          </Button>
        )
      })}
    </div>
  )

  const hasContent =
    activeSlide && children[activeSlide] !== null && children[activeSlide] !== undefined

  const show = hasContent || !isCollapsed

  // --- MINIMAL VARIANT RENDER ---
  if (variant === "minimal") {
    return (
      <div className={`flex flex-col ${className}`}>
        {/* Minimal Header / Button Row */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            {header && <span className="text-sm font-semibold">{header}</span>}
            {description && <span className="text-xs text-muted-text">{description}</span>}
          </div>
          {renderButtonRow()}
        </div>

        {/* Minimal Content Area - No Card styling */}
        <AnimatePresence initial={false}>
          {show && (
            <motion.div
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              variants={collapseVariants}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="overflow-hidden">
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
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // --- DEFAULT VARIANT RENDER ---
  const isRightPosition = buttonPosition === "right"

  const headerClasses = `transition-all duration-300 ${
    isRightPosition ? "flex flex-row items-center justify-between gap-4" : "flex flex-col gap-4"
  }`

  return (
    <Card variant="flat" className={className}>
      <CardHeader className={headerClasses}>
        {isRightPosition ? (
          <>
            <div className="flex flex-col gap-1">
              {header && <span className="text-lg font-semibold">{header}</span>}
              {description && <span className="text-sm text-muted-text">{description}</span>}
            </div>
            {renderButtonRow()}
          </>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              {header && <span className="text-lg font-semibold">{header}</span>}
              {description && <span className="text-sm text-muted-text">{description}</span>}
            </div>
            <div
              className={`flex ${buttonPosition === "center" ? "justify-center" : "justify-start"} w-full`}
            >
              {renderButtonRow()}
            </div>
          </>
        )}
      </CardHeader>

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
