import type { ReactNode } from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

export const Badge = ({
  children,
  variant = 'default',
  className = '',
}: BadgeProps) => {
  const baseClasses =
    'inline-flex px-badge-padding-x py-badge-padding-y text-badge-font-size font-medium rounded-badge-radius'

  const variants: Record<BadgeVariant, string> = {
    default: 'bg-badge-default-bg text-badge-default-color',
    success: 'bg-badge-success-bg text-badge-success-color',
    warning: 'bg-badge-warning-bg text-badge-warning-color',
    error: 'bg-badge-error-bg text-badge-error-color',
  }

  return (
    <span className={`${baseClasses} ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
