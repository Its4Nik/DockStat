import React from 'react';

export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
  return (
    <div className={`pb-4 border-b border-gray-100 ${className}`}>
      {children}
    </div>
  );
};
