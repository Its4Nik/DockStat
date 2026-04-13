import type React from "react"

export interface CardHeaderProps {
  children: React.ReactNode
  size?: "xs" | "sm" | "md" | "lg"
  className?: string
  id?: string
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = "",
  id,
  size = "md",
}) => {
  const sizeClasses: Record<NonNullable<CardHeaderProps["size"]>, string> = {
    lg: "pb-4 text-2xl",
    md: "pb-3 text-xl",
    sm: "pb-2 text-sm",
    xs: "pb-1 text-xs",
  }

  return (
    <div
      className={`${sizeClasses[size]} border-b border-card-header-border text-primary-text ${className}`}
      id={id}
    >
      {children}
    </div>
  )
}
