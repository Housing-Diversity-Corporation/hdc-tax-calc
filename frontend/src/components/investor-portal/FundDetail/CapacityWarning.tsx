import React from 'react';
import { Alert, AlertDescription } from '../../ui/alert';

interface CapacityWarningProps {
  message: string;
}

const CapacityWarning: React.FC<CapacityWarningProps> = ({ message }) => {
  return (
    <Alert className="mb-6 border-amber-300 bg-amber-50">
      <AlertDescription className="text-sm text-amber-800">
        {message}
      </AlertDescription>
    </Alert>
  );
};

export default CapacityWarning;
