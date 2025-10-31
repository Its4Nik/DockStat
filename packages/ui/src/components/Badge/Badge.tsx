import React from 'react';

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
      ? 'text-blue-600 border border-blue-600'
      : 'bg-blue-100 text-blue-800',
    secondary: outlined
      ? 'text-gray-600 border border-gray-600'
      : 'bg-gray-100 text-gray-800',
    success: outlined
      ? 'text-green-600 border border-green-600'
      : 'bg-green-100 text-green-800',
    warning: outlined
      ? 'text-yellow-600 border border-yellow-600'
      : 'bg-yellow-100 text-yellow-800',
    error: outlined
      ? 'text-red-600 border border-red-600'
      : 'bg-red-100 text-red-800',
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
