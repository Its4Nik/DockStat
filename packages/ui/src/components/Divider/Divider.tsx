import type React from "react"

export type DividerVariant = "solid" | "dashed" | "dotted"
export type DividerOrientation = "horizontal" | "vertical"

export interface DividerProps {
  variant?: DividerVariant
  orientation?: DividerOrientation
  className?: string
  shadow?: boolean
  label?: string | React.ReactNode
}

export const Divider: React.FC<DividerProps> = ({
  variant = "solid",
  orientation = "horizontal",
  className = "",
  shadow = true,
  label,
}) => {
  const baseClasses = `border-divider-color ${shadow ? "shadow-2xl" : ""}`
  const variantClasses = {
    dashed: "border-dashed",
    dotted: "border-dotted",
    solid: "border-solid",
  }

  // Horizontal divider (default)
  if (orientation === "horizontal") {
    if (label) {
      return (
        <div className={`flex items-center ${className}`}>
          <div className={`flex-1 border-t ${variantClasses[variant]} ${baseClasses}`} />
          <span className="px-3 text-sm text-divider-text">{label}</span>
          <div className={`flex-1 border-t ${variantClasses[variant]} ${baseClasses}`} />
        </div>
      )
    }

    return (
      <hr className={`w-full border-t ${variantClasses[variant]} ${baseClasses} ${className}`} />
    )
  }

  // Vertical divider
  return (
    <div
      aria-hidden="true"
      className={`min-h-full border-l ${variantClasses[variant]} ${baseClasses} ${className}`}
    />
  )
}
