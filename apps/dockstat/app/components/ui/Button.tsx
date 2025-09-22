import * as React from 'react';
import { cn } from '~/utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'xs' | 'sm' | 'md' | 'lg';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

const base =
  'inline-flex hover:cursor-pointer items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

const variantClasses: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent/50 focus-visible:ring-accent',
  secondary: 'bg-muted border border-border text-gray-800 hover:bg-gray-50 focus-visible:ring-sky-500',
  ghost: 'bg-transparent hover:border-accent text-text-primary hover:bg-card-bg focus-visible:ring-accent border border-border',
  destructive: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
};

const sizeClasses: Record<Size, string> = {
  xs: "px-1 py-1 text-xs",
  sm: 'px-2.5 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, leftIcon, rightIcon, children, className, ...rest }, ref) => {
    const isAriaPressed = (rest as any)['aria-pressed'] !== undefined;
    return (
      <button
        ref={ref}
        className={cn(base, variantClasses[variant], sizeClasses[size], className)}
        type={(rest.type) || 'button'}
        aria-pressed={isAriaPressed ? (rest as any)['aria-pressed'] : undefined}
        {...rest}
      >
        {leftIcon ? <span className="mr-2 inline-flex items-center">{leftIcon}</span> : null}
        <span aria-live={loading ? 'polite' : undefined} className="flex items-center">
          {loading ? <span className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" /> : null}
          {children}
        </span>
        {rightIcon ? <span className="ml-2 inline-flex items-center">{rightIcon}</span> : null}
      </button>
    );
  }
);

Button.displayName = 'Button'
