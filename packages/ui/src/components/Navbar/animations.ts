import type { Variants } from "framer-motion"

export const backdropVariants: Variants = {
  closed: { opacity: 0 },
  open: { opacity: 1 },
}

export const slideUpVariants: Variants = {
  hidden: {
    y: 20,
    opacity: 0,
  },
  open: {
    y: 0,
    opacity: 1,
  },
}

export const busyVariants: Variants = {
  hidden: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.2, ease: "easeInOut" },
  },
  visible: {
    height: "auto",
    opacity: 1,
    transition: { duration: 0.2, ease: "easeInOut" },
  },
}

export const slideInVariants: Variants = {
  closed: {
    x: "-100%",
    opacity: 0,
    transition: {
      stiffness: 300,
      damping: 30,
    },
  },
  open: {
    x: 0,
    opacity: 1,
    transition: {
      stiffness: 300,
      damping: 30,
    },
  },
}
