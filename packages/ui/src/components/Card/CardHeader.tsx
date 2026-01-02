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
    xs: "pb-1 text-xs",
    sm: "pb-2 text-sm",
    md: "pb-3 text-xl",
    lg: "pb-4 text-2xl",
  }

  return (
    <div
      id={id}
      className={`${sizeClasses[size]} border-b border-card-header-border text-primary-text ${className}`}
    >
      {children}
    </div>
  )
}
