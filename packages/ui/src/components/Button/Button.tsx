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

  // Separate ring color classes so we can toggle rings on/off cleanly
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

  const disabledClasses = disabled || loading ? "opacity-50 cursor-not-allowed" : ""

  const widthClass = fullWidth ? "w-full" : ""

  return (
    <button
      type={type}
      className={`${baseClasses} ${!noFocusRing ? focusCommonClasses : ""} ${variantClasses[variant]} ${!noFocusRing ? variantRingClasses[variant] : ""} ${sizeClasses[size]} ${disabledClasses} ${widthClass} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      <span className="flex items-center justify-center">
        {/* Spinner placeholder */}
        <span className={`inline-flex ${loading ? "w-4 mr-2" : "w-0"} h-4`}>
          {loading && (
            <svg className="animate-spin" fill="none" viewBox="0 0 24 24">
              <title>Loading Spinner</title>
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2
                  5.291A7.962 7.962 0 014 12H0c0
                  3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
        </span>
        {children}
      </span>
    </button>
  )
}
