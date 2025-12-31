import React from 'react';
import { Checkbox } from '../../../ui/checkbox';
import { Label } from '../../../ui/label';

interface HDCCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
}

export const HDCCheckbox: React.FC<HDCCheckboxProps> = ({
  checked,
  onCheckedChange,
  label,
  disabled = false,
  className = '',
  labelClassName = ''
}) => {
  if (label) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Checkbox
          id={label}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          className="h-4 w-4"
        />
        <Label
          htmlFor={label}
          className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer ${labelClassName}`}
        >
          {label}
        </Label>
      </div>
    );
  }

  return (
    <Checkbox
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={`h-4 w-4 ${className}`}
    />
  );
};

export default HDCCheckbox;
