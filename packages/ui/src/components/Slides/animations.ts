import type { Variants } from "framer-motion"

export const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
  }),
  center: {
    x: 0,
    position: "relative" as const,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? "-100%" : "100%",
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
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
