import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: ButtonVariant
  className?: string
}

export const Button = ({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonProps) => {
  const baseClasses =
    'px-button-padding-x py-button-padding-y rounded-button-radius font-button-font-size focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors'

  const variants: Record<ButtonVariant, string> = {
    primary:
      'bg-button-primary-bg text-button-primary-color hover:bg-button-primary-hover-bg focus:ring-button-primary-bg',
    secondary:
      'bg-button-secondary-bg text-button-secondary-color hover:bg-button-secondary-hover-bg focus:ring-button-secondary-bg',
  }

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
