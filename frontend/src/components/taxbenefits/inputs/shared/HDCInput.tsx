import React from 'react';
import { Input } from '../../../ui/input';
import { cn } from '../../../../lib/utils';

interface HDCInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
}

export const HDCInput: React.FC<HDCInputProps> = ({
  label,
  helperText,
  className,
  ...props
}) => {
  return (
    <div className="hdc-input-group">
      {label && (
        <label className="hdc-input-label">
          {label}
          {helperText && (
            <span className="block text-xs text-gray-600 font-normal mt-1">
              {helperText}
            </span>
          )}
        </label>
      )}
      <Input
        {...props}
        className={cn('hdc-input', className)}
      />
    </div>
  );
};

export default HDCInput;
