import type React from 'react';

export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  rounded?: boolean;
  outlined?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  rounded = false,
  outlined = false,
}) => {
  const baseClasses = 'inline-flex items-center font-medium';

  const variantClasses = {
    primary: outlined
      ? 'text-badge-primary-outlined-text border border-badge-primary-outlined-border'
      : 'bg-badge-primary-bg text-badge-primary-text',
    secondary: outlined
      ? 'text-badge-secondary-outlined-text border border-badge-secondary-outlined-border'
      : 'bg-badge-secondary-bg text-badge-secondary-text',
    success: outlined
      ? 'text-badge-success-outlined-text border border-badge-success-outlined-border'
      : 'bg-badge-success-bg text-badge-success-text',
    warning: outlined
      ? 'text-badge-warning-outlined-text border border-badge-warning-outlined-border'
      : 'bg-badge-warning-bg text-badge-warning-text',
    error: outlined
      ? 'text-badge-error-outlined-text border border-badge-error-outlined-border'
      : 'bg-badge-error-bg text-badge-error-text',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base',
  };

  const roundedClass = rounded ? 'rounded-full' : 'rounded-md';

  return (
    <span
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${roundedClass} ${className}`}
    >
      {children}
    </span>
  );
};
