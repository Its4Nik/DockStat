import type React from 'react';

export interface HoverBubbleProps {
  label: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
  className?: string;
}

export const HoverBubble: React.FC<HoverBubbleProps> = ({
  label,
  position = 'top',
  children,
  className = '',
}) => {
  const positionClasses: Record<string, string> = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  };

  return (
    <div className="relative group inline-block">
      {children}
      <div
        className={`absolute z-10 hidden group-hover:block bg-hover-bubble-bg text-hover-bubble-text text-xs rounded px-2 py-1 whitespace-nowrap ${positionClasses[position]} ${className}`}
      >
        {label}
      </div>
    </div>
  );
};
