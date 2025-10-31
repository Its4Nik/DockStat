import React from 'react';

export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
  return (
    <div className={`pt-4 border-t border-gray-100 ${className}`}>
      {children}
    </div>
  );
};
