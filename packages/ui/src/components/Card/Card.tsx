import React from 'react';

export type CardVariant = 'default' | 'outlined' | 'elevated' | 'flat';
export type CardSize = 'sm' | 'md' | 'lg';

export interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  size?: CardSize;
  className?: string;
  onClick?: () => void;
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
  const baseClasses = 'rounded-lg transition-all duration-200';

  const variantClasses = {
    default: 'bg-white border border-gray-200',
    outlined: 'border-2 border-gray-300 bg-transparent',
    elevated: 'bg-white shadow-md',
    flat: 'bg-gray-50 border-none',
  };

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverClasses = hoverable ? 'hover:shadow-lg hover:-translate-y-1 cursor-pointer' : '';

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${hoverClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export { CardBody, type CardBodyProps } from "./CardBody"
export { CardFooter, type CardFooterProps } from "./CardFooter"
export { CardHeader, type CardHeaderProps } from "./CardHeader"
