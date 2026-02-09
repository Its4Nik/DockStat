import { useEffect, useRef, useState } from "react"
import type { SlidesProps } from "./types"

export const useSlidesState = ({
  children,
  controlledSlide,
  defaultSlide,
  hideable,
  onSlideChange,
}: Pick<
  SlidesProps,
  "children" | "defaultSlide" | "controlledSlide" | "hideable" | "onSlideChange"
>) => {
  const slideKeys = Object.keys(children)
  const initialSlide = hideable ? null : defaultSlide || slideKeys[0] || ""

  const [internalSlide, setInternalSlide] = useState<string | null>(initialSlide)
  const [animationDirection, setAnimationDirection] = useState<1 | -1>(1)
  const [isCollapsed, setIsCollapsed] = useState(hideable)
  const [contentHeight, setContentHeight] = useState<number>(0)
  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const isControlled = controlledSlide !== undefined
  const activeSlide = isControlled ? controlledSlide : internalSlide

  // Handle controlled component updates
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

  useEffect(() => {
    if (!contentRefs.current) return

    const refs = Object.values(contentRefs.current)

    const resizeObserver = new ResizeObserver(() => {
      if (activeSlide) {
        const height = contentRefs.current[activeSlide]?.offsetHeight || 0
        setContentHeight(height)
      }
    })

    for (const ref of refs) {
      if (ref) {
        resizeObserver.observe(ref)
      }
    }
    return () => resizeObserver.disconnect()
  })

  // Measure content height when active slide changes
  useEffect(() => {
    if (activeSlide && contentRefs.current[activeSlide]) {
      const height = contentRefs.current[activeSlide]?.offsetHeight || 0
      setContentHeight(height)
    }
  }, [activeSlide])

  const changeSlide = (newSlide: string) => {
    // Hide if clicking active slide while hideable
    if (hideable && newSlide === activeSlide) {
      setIsCollapsed(true)
      if (!isControlled) {
        setInternalSlide(null)
      }
      onSlideChange?.(null)
      return
    }

    // Expand if collapsed or no active slide
    if (isCollapsed || activeSlide === null) {
      setIsCollapsed(false)
      setAnimationDirection(1)
      if (!isControlled) {
        setInternalSlide(newSlide)
      }
      onSlideChange?.(newSlide)
      return
    }

    // Ignore if clicking same slide while open
    if (newSlide === activeSlide) return

    // Standard slide change
    const newIndex = slideKeys.indexOf(newSlide)
    const currentIndex = slideKeys.indexOf(activeSlide)

    setAnimationDirection(newIndex > currentIndex ? 1 : -1)

    if (!isControlled) {
      setInternalSlide(newSlide)
    }
    onSlideChange?.(newSlide)
  }

  return {
    slideKeys,
    activeSlide,
    animationDirection,
    isCollapsed,
    contentHeight,
    contentRefs,
    isControlled,
    changeSlide,
  }
}

export type UseSlideReturn = ReturnType<typeof useSlidesState>
