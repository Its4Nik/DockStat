import type React from 'react';
import { Checkbox } from './Checkbox';

export interface CheckboxGroupOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface CheckboxGroupProps {
  options: CheckboxGroupOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  direction?: 'horizontal' | 'vertical';
  className?: string;
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  options,
  selectedValues,
  onChange,
  direction = 'vertical',
  className = '',
}) => {
  const handleCheckboxChange = (value: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedValues, value]);
    } else {
      onChange(selectedValues.filter(v => v !== value));
    }
  };

  const directionClass = direction === 'horizontal' ? 'flex flex-row space-x-4' : 'flex flex-col space-y-2';

  return (
    <div className={`${directionClass} ${className}`}>
      {options.map((option) => (
        <Checkbox
          key={option.value}
          label={option.label}
          checked={selectedValues.includes(option.value)}
          onChange={(checked) => handleCheckboxChange(option.value, checked)}
          disabled={option.disabled}
        />
      ))}
    </div>
  );
};
