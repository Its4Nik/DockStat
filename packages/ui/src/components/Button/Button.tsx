import { motion } from "framer-motion"
import { buttonMotionVariants, buttonTransition } from "./animations"
import { ButtonSpinner } from "./spinner"

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger"
export type ButtonSize = "xs" | "sm" | "md" | "lg"

export interface ButtonProps {
  children: React.ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  type?: "button" | "submit" | "reset"
  className?: string
  fullWidth?: boolean
  /**
   * When true, removes all focus/ring styles from the button.
   * Useful for cases where the surrounding UI provides its own focus handling
   * or when you want to disable focus rings for visual reasons.
   */
  noFocusRing?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  onClick,
  type = "button",
  className = "",
  fullWidth = false,
  noFocusRing = false,
}) => {
  const isInactive = disabled || loading

  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-md transition-colors"
  const focusCommonClasses = "focus:outline-none focus:ring-2 focus:ring-offset-2"

  const variantClasses: Record<ButtonVariant, string> = {
    primary: "bg-button-primary-bg text-button-primary-text hover:bg-button-primary-hover-bg",
    secondary:
      "bg-button-secondary-bg text-button-secondary-text hover:bg-button-secondary-hover-bg",
    outline:
      "border border-button-outline-border bg-transparent text-button-outline-text hover:bg-button-outline-hover-bg",
    ghost: "bg-transparent text-button-ghost-text hover:bg-button-ghost-hover-bg",
    danger: "bg-button-danger-bg text-button-danger-text hover:bg-button-danger-hover-bg",
  }

  const variantRingClasses: Record<ButtonVariant, string> = {
    primary: "focus:ring-button-primary-text-hover-ring",
    secondary: "focus:ring-button-secondary-text-hover-ring",
    outline: "focus:ring-button-outline-border-hover-ring",
    ghost: "focus:ring-button-ghost-hover-ring",
    danger: "focus:ring-button-danger-hover-ring",
  }

  const sizeClasses = {
    xs: "px-1 py-0.5 text-xs",
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  }

  const widthClass = fullWidth ? "w-full" : ""

  return (
    <motion.button
      type={type}
      disabled={isInactive}
      onClick={onClick}
      className={`${baseClasses} ${!noFocusRing ? focusCommonClasses : ""} ${variantClasses[variant]} ${!noFocusRing ? variantRingClasses[variant] : ""} ${sizeClasses[size]} ${widthClass} ${className}`}
      /* --- STATE ANIMATION --- */
      variants={buttonMotionVariants}
      animate={isInactive ? "inactive" : "active"}
      /* entry/exit smoothness */
      transition={buttonTransition}
      /* tactile press feedback */
      whileTap={!isInactive ? { scale: 0.96 } : undefined}
      /* prevents click while animating */
      style={{
        cursor: isInactive ? "not-allowed" : "pointer",
        pointerEvents: isInactive ? "none" : "auto",
      }}
    >
      <span className="flex items-center justify-center">
        {/* Animated spinner space (no layout jump) */}
        <ButtonSpinner loading={loading} />
        {children}
      </span>
    </motion.button>
  )
}
