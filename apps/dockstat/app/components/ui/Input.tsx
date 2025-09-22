import * as React from 'react';
import { cn } from '~/utils/cn';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  id?: string;
  error?: string | null;
  hint?: string | null;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ label, id, error, hint, className, ...rest }, ref) => {
  const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={cn('flex flex-col space-y-1', className)}>
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        ref={ref}
        className={cn(
          'rounded-md border px-3 py-2 placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500',
          error ? 'border-red-400' : 'border-gray-200'
        )}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        {...rest}
      />
      {error ? (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-sm text-gray-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
