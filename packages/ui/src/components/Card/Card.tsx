import type { MouseEventHandler } from 'react';
import type React from 'react';

export type CardVariant = 'default' | 'outlined' | 'elevated' | 'flat';
export type CardSize = 'sm' | 'md' | 'lg';

export interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  size?: CardSize;
  className?: string;
  onClick?: MouseEventHandler;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  onClick,
  hoverable = false,
}) => {
  const baseClasses = 'shadow-xl rounded-lg transition-all duration-200';

  const variantClasses = {
    default: 'bg-card-default-bg border border-card-default-border text-primary-text',
    outlined: 'border border-card-outlined-border bg-transparent text-secondary-text',
    elevated: 'bg-card-elevated-bg shadow-2xl text-primary-text',
    flat: 'bg-card-flat-bg border-none text-muted-text',
  };

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverClasses = hoverable ? 'hover:shadow-lg hover:-translate-y-1' : '';

  return (
    <button
      type="button"
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${hoverClasses} ${onClick ? "cursor-pointer" : ""} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export { CardBody, type CardBodyProps } from "./CardBody"
export { CardFooter, type CardFooterProps } from "./CardFooter"
export { CardHeader, type CardHeaderProps } from "./CardHeader"
