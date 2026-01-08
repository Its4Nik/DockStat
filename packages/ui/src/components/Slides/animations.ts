import type { Variants } from "framer-motion"

const slideVariants = (direction: number): Variants => {
  return {
    enter: {
      x: direction > 0 ? "100%" : "-100%",
      position: "absolute" as const,
      top: 0,
      left: 0,
      right: 0,
    },
    center: {
      x: 0,
      position: "relative" as const,
    },
    exit: {
      x: direction > 0 ? "-100%" : "100%",
      position: "absolute" as const,
      top: 0,
      left: 0,
      right: 0,
    },
  }
}

const collapseVariants = (contentHeight: number): Variants => {
  return {
    collapsed: {
      height: 0,
      opacity: 0,
    },
    expanded: {
      height: contentHeight || "auto",
      opacity: 1,
    },
  }
}

export { collapseVariants, slideVariants }
