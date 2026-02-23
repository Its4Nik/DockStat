const buttonMotionVariants = {
  active: {
    opacity: 1,
    scale: 1,
    filter: "saturate(1) contrast(1)",
  },
  inactive: {
    opacity: 0.55,
    scale: 0.98,
    filter: "saturate(0.6) contrast(0.9)",
  },
} as const

const buttonTransition = {
  duration: 0.18,
  ease: [0.22, 1, 0.36, 1],
} as const

const spinnerVariants = {
  loading: { width: 16, marginRight: 8, opacity: 1 },
  idle: { width: 0, marginRight: 0, opacity: 0 },
} as const

const spinnerTransition = { duration: 0.15 } as const

export { buttonMotionVariants, buttonTransition, spinnerTransition, spinnerVariants }
