import type { Variants } from "framer-motion"

const backdropVariants: Variants = {
  exit: { opacity: 0 },
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
} as const

const modalVariants: Variants = {
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.15,
      ease: "easeOut" as const,
    },
    y: 10,
  },
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      damping: 25,
      stiffness: 300,
      type: "spring" as const,
    },
    y: 0,
  },
}

const glassModalVariants: Variants = {
  exit: {
    ...modalVariants.exit,
    backdropFilter: "blur(16px)",
  },
  hidden: {
    ...modalVariants.hidden,
    backdropFilter: "blur(16px)",
  },
  visible: {
    ...modalVariants.visible,
    backdropFilter: "blur(16px)",
    transition: {
      backdropFilter: { duration: 0.2 },
      damping: 25,
      stiffness: 300,
      type: "spring" as const,
    },
  },
}

export { backdropVariants, modalVariants, glassModalVariants }
