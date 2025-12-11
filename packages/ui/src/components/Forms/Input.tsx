import type React from "react"

export type InputSize = "sm" | "md" | "lg"
export type InputVariant = "default" | "filled" | "underline"

export interface InputProps {
  type?: "text" | "email" | "password" | "number" | "tel" | "url"
  size?: InputSize
  variant?: InputVariant
  disabled?: boolean
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  className?: string
  error?: boolean
  success?: boolean
}

export const Input: React.FC<InputProps> = ({
  type = "text",
  size = "md",
  variant = "default",
  disabled = false,
  placeholder,
  value,
  onChange,
  className = "",
  error = false,
  success = false,
}) => {
  const baseClasses = "w-full transition-colors focus:outline-none"

  const sizeClasses = {
    sm: "px-2 py-1 text-sm",
    md: "px-3 py-2 text-base",
    lg: "px-4 py-3 text-lg",
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
      type={type}
      className={[
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        className,
        disabledClasses,
        error ? "border-error! focus:border-error! focus:ring-error!" : "",
        success ? "border-success! focus:border-success! focus:ring-success!" : "",
      ].join(" ")}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
    />
  )
}
