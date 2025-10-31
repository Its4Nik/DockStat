import React from 'react';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'default' | 'filled' | 'underline';

export interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  size?: InputSize;
  variant?: InputVariant;
  disabled?: boolean;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  error?: boolean;
  success?: boolean;
}

export const Input: React.FC<InputProps> = ({
  type = 'text',
  size = 'md',
  variant = 'default',
  disabled = false,
  placeholder,
  value,
  onChange,
  className = '',
  error = false,
  success = false,
}) => {
  const baseClasses = 'w-full transition-colors focus:outline-none';

  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2 text-base',
    lg: 'px-4 py-3 text-lg',
  };

  const variantClasses = {
    default: 'border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
    filled: 'bg-gray-100 border-none rounded-md focus:bg-white focus:ring-2 focus:ring-blue-500',
    underline: 'border-b-2 border-gray-300 bg-transparent rounded-none focus:border-blue-500',
  };

  const stateClasses = error
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
    : success
      ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
      : '';

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : '';

  return (
    <input
      type={type}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${stateClasses} ${disabledClasses} ${className}`}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
    />
  );
};
