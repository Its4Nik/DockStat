import React from 'react';

export type DividerVariant = 'solid' | 'dashed' | 'dotted';

export interface DividerProps {
  variant?: DividerVariant;
  className?: string;
  label?: string;
}

export const Divider: React.FC<DividerProps> = ({
  variant = 'solid',
  className = '',
  label,
}) => {
  const baseClasses = 'border-gray-300';
  const variantClasses = {
    solid: 'border-solid',
    dashed: 'border-dashed',
    dotted: 'border-dotted',
  };

  if (label) {
    return (
      <div className={`flex items-center ${className}`}>
        <div className={`flex-1 border-t ${variantClasses[variant]} ${baseClasses}`} />
        <span className="px-3 text-sm text-gray-500">{label}</span>
        <div className={`flex-1 border-t ${variantClasses[variant]} ${baseClasses}`} />
      </div>
    );
  }

  return (
    <hr
      className={`w-full border-t ${variantClasses[variant]} ${baseClasses} ${className}`}
    />
  );
};
