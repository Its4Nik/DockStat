export type InputSize = "sm" | "md" | "lg"
export type InputVariant = "default" | "filled" | "underline"

export interface InputProps {
  type?: "text" | "email" | "password" | "number" | "tel" | "url" | "color"
  size?: InputSize
  variant?: InputVariant
  disabled?: boolean
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  className?: string
  error?: boolean
  success?: boolean
  autoFocus?: boolean
  required?: boolean
}

export function Input({
  type = "text",
  size = "md",
  variant = "default",
  disabled = false,
  placeholder,
  value,
  onChange,
  className = "",
  error = false,
  autoFocus = false,
  success = false,
  required = false,
}: InputProps) {
  const baseClasses = "w-full transition-colors focus:outline-none"

  const sizeClasses = {
    lg: "px-4 py-3 text-lg",
    md: "px-3 py-2 text-base",
    sm: "px-2 py-1 text-sm",
  }

  const variantClasses = {
    default:
      "text-input-default-text border border-input-default-border rounded-md focus:border-input-default-focus-border focus:ring-1 focus:ring-input-default-focus-ring",
    filled:
      "text-input-filled-text bg-input-filled-bg border-none rounded-md focus:bg-input-filled-focus-bg focus:ring-2 focus:ring-input-filled-focus-ring",
    underline:
      "text-input-underline-text border-b-2 border-input-underline-color bg-transparent rounded-none focus:border-input-underline-focus-color",
  }

  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed bg-gray-100" : ""

  return (
    <input
      className={[
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        className,
        disabledClasses,
        error ? "border-error! focus:border-error! focus:ring-error!" : "",
        success ? "border-success! focus:border-success! focus:ring-success!" : "",
      ].join(" ")}
      disabled={disabled}
      // biome-ignore lint/a11y/noAutofocus: Used in other components
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      required={required}
      type={type}
      value={value}
    />
  )
}
