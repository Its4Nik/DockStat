import type React from "react"

export interface CardHeaderProps {
  children: React.ReactNode
  className?: string
  id?: string
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = "", id }) => {
  return (
    <div
      id={id}
      className={`text-2xl pb-4 border-b border-card-header-border text-primary-text ${className}`}
    >
      {children}
    </div>
  )
}
