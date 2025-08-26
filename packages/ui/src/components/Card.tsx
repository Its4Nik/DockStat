import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export const Card = ({ children, className = '' }: CardProps) => (
  <div
    className={`rounded-components-card-radius bg-components-card-bg shadow-components-card-shadow p-components-card-padding ${className}`}
  >
    {children}
  </div>
)

export const CardHeader = ({ children, className = '' }: CardProps) => (
  <div className={`p-components-card-header-padding ${className}`}>
    {children}
  </div>
)

export const CardContent = ({ children, className = '' }: CardProps) => (
  <div
    className={`text-components-card-content-font-size text-components-card-content-font-color ${className}`}
  >
    {children}
  </div>
)

export const CardFooter = ({ children, className = '' }: CardProps) => (
  <div className={`p-components-card-footer-padding ${className}`}>
    {children}
  </div>
)
