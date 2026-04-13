import type React from "react"

export type SelectSize = "sm" | "md" | "lg"
export type SelectVariant = "default" | "filled" | "underline"

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps {
  size?: SelectSize
  variant?: SelectVariant
  disabled?: boolean
  placeholder?: string
  value?: string
  rawOnChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  onChange?: (value: string) => void
  className?: string
  error?: boolean
  success?: boolean
  autoFocus?: boolean
  options: SelectOption[]
}

export const Select: React.FC<SelectProps> = ({
  size = "md",
  variant = "default",
  disabled = false,
  placeholder,
  value,
  onChange,
  rawOnChange,
  className = "",
  error = false,
  success = false,
  autoFocus = false,
  options,
}) => {
  const baseClasses = "w-full transition-colors focus:outline-none"

  const sizeClasses = {
    lg: "px-4 py-3 text-lg",
    md: "px-3 py-2 text-base",
    sm: "px-2 py-1 text-sm",
  }

  const variantClasses = {
    default:
      "text-select-default-text border border-select-default-border rounded-md focus:border-select-default-focus-border focus:ring-1 focus:ring-select-default-focus-ring",
    filled:
      "text-select-filled-text bg-select-filled-bg border-none rounded-md focus:bg-select-filled-focus-bg focus:ring-2 focus:ring-select-filled-focus-ring",
    underline:
      "text-select-underline-text border-b-2 border-select-underline-color bg-transparent rounded-none focus:border-select-underline-focus-color",
  }

  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed bg-gray-100" : ""

  return (
    <select
      // biome-ignore lint/a11y/noAutofocus: Used in other components
      autoFocus={autoFocus}
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
      onChange={(e) => rawOnChange?.(e) || onChange?.(e.target.value)}
      value={value}
    >
      {placeholder && (
        <option
          disabled
          value=""
        >
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option
          disabled={option.disabled}
          key={option.value}
          value={option.value}
        >
          {option.label}
        </option>
      ))}
    </select>
  )
}
