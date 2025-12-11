import type React from "react"

export interface CardBodyProps {
  children: React.ReactNode
  className?: string
}

export const CardBody: React.FC<CardBodyProps> = ({ children, className = "" }) => {
  return <div className={`py-4 text-secondary-text ${className}`}>{children}</div>
}
