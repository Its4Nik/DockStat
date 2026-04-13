import type { Variants } from "framer-motion"

export const backdropVariants: Variants = {
  closed: { opacity: 0 },
  open: { opacity: 1 },
}

export const slideUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  open: {
    opacity: 1,
    y: 0,
  },
}

export const busyVariants: Variants = {
  hidden: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.05, ease: "easeInOut" },
  },
  visible: {
    height: "auto",
    opacity: 1,
    transition: { duration: 0.05, ease: "easeInOut" },
  },
}

export const animatedBlur: Variants = {
  closed: {
    backdropFilter: "blur(0px)",
    opacity: 0,
  },
  opened: {
    backdropFilter: "blur(16px)",
    opacity: 1,
  },
}

export const slideInVariants: Variants = {
  closed: {
    opacity: 0,
    transition: {
      damping: 30,
      stiffness: 300,
    },
    x: "-100%",
  },
  open: {
    opacity: 1,
    transition: {
      damping: 30,
      stiffness: 300,
    },
    x: 0,
  },
}

export const reverseSlideInVariants: Variants = {
  closed: {
    opacity: 0,
    transition: {
      damping: 30,
      stiffness: 300,
    },
    x: "100%",
  },
  open: {
    opacity: 1,
    transition: {
      damping: 30,
      stiffness: 300,
    },
    x: 0,
  },
}
