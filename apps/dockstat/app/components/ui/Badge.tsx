import type * as React from 'react';
import { cn } from '~/utils/cn';

type Variant = 'neutral' | 'success' | 'warning' | 'danger';
type Size = 'sm' | 'md';

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: Variant;
  size?: Size;
  icon?: React.ReactNode;
  label?: string; // used for aria-label if children are not descriptive
};

const variantMap: Record<Variant, string> = {
  neutral: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
};

const sizeMap: Record<Size, string> = {
  sm: 'text-xs px-2 py-0.5 rounded',
  md: 'text-sm px-2.5 py-0.5 rounded-md',
};

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', size = 'md', icon, children, className, label, ...rest }) => {
  const hasText = typeof children === 'string' && children.trim().length > 0;
  return (
    <span
      role={hasText ? undefined : 'status'}
      aria-label={!hasText && label ? label : undefined}
      className={cn('inline-flex items-center gap-2 font-medium', variantMap[variant], sizeMap[size], className)}
      {...rest}
    >
      {icon ? <span className="flex-shrink-0 inline-flex items-center">{icon}</span> : null}
      {children}
    </span>
  );
};
