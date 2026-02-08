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
  const [isCollapsed, setIsCollapsed] = useState<boolean>(!!hideable)
  const [contentHeight, setContentHeight] = useState<number>(0)

  // Refs to the rendered content elements for each slide key
  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  const isControlled = controlledSlide !== undefined
  const activeSlide = isControlled ? (controlledSlide as string | null) : internalSlide

  // Handle controlled component updates
  useEffect(() => {
    if (!isControlled) return

    // If controlledSlide explicitly set to null/undefined, collapse
    if (controlledSlide === null || controlledSlide === undefined) {
      setIsCollapsed(true)
      return
    }

    const newIndex = slideKeys.indexOf(controlledSlide)
    const currentIndex = slideKeys.indexOf(activeSlide || "")
    setAnimationDirection(newIndex > currentIndex ? 1 : -1)
    setIsCollapsed(false)
  }, [controlledSlide, isControlled, activeSlide, slideKeys])

  // Measure content height and keep it in sync when active slide changes or its size changes.
  // We use ResizeObserver when available so dynamic content that changes after mount will
  // update the measured height automatically.
  useEffect(() => {
    // Cleanup any previous observer
    if (resizeObserverRef.current) {
      try {
        resizeObserverRef.current.disconnect()
      } catch {
        // ignore
      }
      resizeObserverRef.current = null
    }

    // If there's no active slide, clear height
    if (activeSlide == null) {
      setContentHeight(0)
      return
    }

    const el = contentRefs.current[activeSlide] ?? null

    // If no element yet, set to 0 and return (it will be observed later when ref attaches)
    if (!el) {
      setContentHeight(0)
      return
    }

    // Initial measurement
    setContentHeight(el.offsetHeight || 0)

    // If ResizeObserver isn't available, skip observing
    if (typeof window === "undefined" || typeof window.ResizeObserver === "undefined") {
      return
    }

    const observer = new window.ResizeObserver((entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        if (entry.target === el) {
          const newHeight =
            entry.contentRect?.height || (entry.target as HTMLElement).offsetHeight || 0
          setContentHeight(Math.round(newHeight))
          return
        }
      }
    })

    resizeObserverRef.current = observer
    observer.observe(el)

    return () => {
      try {
        observer.disconnect()
      } catch {
        // ignore
      }
      if (resizeObserverRef.current === observer) resizeObserverRef.current = null
    }
    // We intentionally only re-run when activeSlide changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const currentIndex = slideKeys.indexOf(activeSlide || "")

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
