const buttonMotionVariants = {
  active: {
    filter: "saturate(1) contrast(1)",
    opacity: 1,
    scale: 1,
  },
  inactive: {
    filter: "saturate(0.6) contrast(0.9)",
    opacity: 0.55,
    scale: 0.98,
  },
} as const

const buttonTransition = {
  duration: 0.18,
  ease: [0.22, 1, 0.36, 1],
} as const

const spinnerVariants = {
  idle: { marginRight: 0, opacity: 0, width: 0 },
  loading: { marginRight: 8, opacity: 1, width: 16 },
} as const

const spinnerTransition = { duration: 0.15 } as const

export { buttonMotionVariants, buttonTransition, spinnerTransition, spinnerVariants }
