import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export const Card = ({ children, className = '' }: CardProps) => (
  <div
    className={`rounded-card-radius bg-card-bg shadow-card-shadow p-card-padding ${className}`}
  >
    {children}
  </div>
)

export const CardHeader = ({ children, className = '' }: CardProps) => (
  <div className={`p-card-header-padding ${className}`}>
    {children}
  </div>
)

export const CardContent = ({ children, className = '' }: CardProps) => (
  <div
    className={`text-card-content-font-size text-card-content-font-color ${className}`}
  >
    {children}
  </div>
)

export const CardFooter = ({ children, className = '' }: CardProps) => (
  <div className={`p-card-footer-padding ${className}`}>
    {children}
  </div>
)
