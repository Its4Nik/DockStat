import type React from 'react';

export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center"
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '', align = "center" }) => {
  return (
    <div className={`pt-4 border-t border-card-footer-border text-muted-text ${align !== "center" ? align === "left" ? "text-left" : "text-right" : ""} ${className}`}>
      {children}
    </div>
  );
};
