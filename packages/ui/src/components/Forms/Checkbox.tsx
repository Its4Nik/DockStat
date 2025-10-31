import React from 'react';

export type CheckboxSize = 'sm' | 'md' | 'lg';

export interface CheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: CheckboxSize;
  label?: string;
  className?: string;
  indeterminate?: boolean;
  id?: string;
  name?: string;
  value?: string;
  'aria-label'?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>((props, ref) => {
  const {
    checked = false,
    onChange,
    disabled = false,
    size = 'md',
    label,
    className = '',
    indeterminate = false,
    id,
    name,
    value,
    ...rest
  } = props;

  const internalRef = React.useRef<HTMLInputElement | null>(null);
  // expose ref
  React.useImperativeHandle(ref, () => internalRef.current as HTMLInputElement, []);

  // keep indeterminate in sync whenever prop changes
  React.useEffect(() => {
    if (internalRef.current) {
      internalRef.current.indeterminate = Boolean(indeterminate);
    }
  }, [indeterminate]);

  const sizeClasses: Record<CheckboxSize, string> = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const baseClasses =
    'rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 disabled:opacity-50';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // when user interacts, the checkbox native checked value is accurate
    onChange?.(e.target.checked);
  };

  // aria-checked supports 'mixed' for indeterminate state
  const ariaChecked: 'true' | 'false' | 'mixed' = indeterminate ? 'mixed' : checked ? 'true' : 'false';

  return (
    <label
      className={`inline-flex items-center ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      aria-disabled={disabled}
    >
      <input
        id={id}
        name={name}
        value={value}
        ref={internalRef}
        type="checkbox"
        className={`${sizeClasses[size]} ${baseClasses}`}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        aria-checked={ariaChecked}
        {...rest}
      />
      {label && <span className="ml-2 text-gray-700">{label}</span>}
    </label>
  );
});

Checkbox.displayName = 'Checkbox';
