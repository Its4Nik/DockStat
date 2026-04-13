import type { Variants } from "framer-motion"

export const slideVariants: Variants = {
  center: {
    position: "relative" as const,
    x: 0,
  },
  enter: (direction: number) => ({
    left: 0,
    position: "absolute" as const,
    right: 0,
    top: 0,
    x: direction > 0 ? "100%" : "-100%",
  }),
  exit: (direction: number) => ({
    left: 0,
    position: "absolute" as const,
    right: 0,
    top: 0,
    x: direction > 0 ? "-100%" : "100%",
  }),
}

export const collapseVariants = (contentHeight: number): Variants => ({
  collapsed: {
    height: 0,
    opacity: 0,
  },
  expanded: {
    height: contentHeight || "auto",
    opacity: 1,
  },
})
