import type React from "react"

export type ToggleSize = "sm" | "md" | "lg"

export interface ToggleProps {
  checked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  size?: ToggleSize
  label?: string
  className?: string
}

export const Toggle: React.FC<ToggleProps> = ({
  checked = false,
  onChange,
  disabled = false,
  size = "md",
  label,
  className = "",
}) => {
  const sizeClasses = {
    sm: "w-8 h-4",
    md: "w-12 h-6",
    lg: "w-16 h-8",
  }

  const dotSizeClasses = {
    sm: "w-3 h-3",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  }

  const dotPositionClasses = {
    sm: checked ? "translate-x-4" : "translate-x-1",
    md: checked ? "translate-x-6" : "translate-x-1",
    lg: checked ? "translate-x-8" : "translate-x-1",
  }

  return (
    <label
      className={`inline-flex items-center cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={disabled}
        />
        <div
          className={`${sizeClasses[size]} rounded-full transition-colors ${
            checked ? "bg-toggle-true" : "bg-toggle-false"
          }`}
        />
        <div
          className={`absolute top-1/2 -translate-y-1/2 ${dotSizeClasses[size]} rounded-full bg-toggle-dot transition-transform ${dotPositionClasses[size]}`}
        />
      </div>
      {label && <span className="ml-3 text-secondary-text">{label}</span>}
    </label>
  )
}
