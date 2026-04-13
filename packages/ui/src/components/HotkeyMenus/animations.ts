import type { Variants } from "framer-motion"

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { delayChildren: 0.05, staggerChildren: 0.03 },
  },
}

export const itemVariants: Variants = {
  exit: {
    filter: "blur(4px)",
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.2, ease: "easeOut" },
    y: -10,
  },
  hidden: {
    filter: "blur(4px)",
    opacity: 0,
    scale: 0.8,
    y: 20,
  },
  hover: {
    scale: 1.02,
    transition: { damping: 25, stiffness: 400, type: "spring" },
  },
  tap: { scale: 0.98 },
  visible: {
    filter: "blur(0px)",
    opacity: 1,
    scale: 1,
    transition: { damping: 24, stiffness: 300, type: "spring" },
    y: 0,
  },
}
