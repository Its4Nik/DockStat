import type { Variants } from "framer-motion"

const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
} as const

const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: {
      duration: 0.15,
      ease: "easeOut" as const,
    },
  },
}

const glassModalVariants: Variants = {
  hidden: {
    ...modalVariants.hidden,
    backdropFilter: "blur(16px)",
  },
  visible: {
    ...modalVariants.visible,
    backdropFilter: "blur(16px)",
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 25,
      backdropFilter: { duration: 0.2 },
    },
  },
  exit: {
    ...modalVariants.exit,
    backdropFilter: "blur(16px)",
  },
}

export { backdropVariants, modalVariants, glassModalVariants }
