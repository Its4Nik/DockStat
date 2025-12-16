import type React from "react"

export interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = "" }) => {
  return (
    <div
      className={`text-2xl pb-4 border-b border-card-header-border text-primary-text ${className}`}
    >
      {children}
    </div>
  )
}
