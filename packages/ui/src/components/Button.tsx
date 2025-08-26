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
    'px-components-button-padding-x py-components-button-padding-y rounded-components-button-radius font-components-button-font-size focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors'

  const variants: Record<ButtonVariant, string> = {
    primary:
      'bg-components-button-primary-bg text-components-button-primary-color hover:bg-components-button-primary-hover-bg focus:ring-components-button-primary-bg',
    secondary:
      'bg-components-button-secondary-bg text-components-button-secondary-color hover:bg-components-button-secondary-hover-bg focus:ring-components-button-secondary-bg',
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
