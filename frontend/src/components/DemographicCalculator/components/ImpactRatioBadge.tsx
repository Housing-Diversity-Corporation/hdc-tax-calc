import React from 'react';

interface ImpactRatioBadgeProps {
  ratio: number;
  showLabel?: boolean;
}

export const ImpactRatioBadge: React.FC<ImpactRatioBadgeProps> = ({ ratio, showLabel = true }) => {
  const getColor = () => {
    if (ratio > 1.5) return 'text-red-600';
    if (ratio > 1.2) return 'text-orange-600';
    if (ratio > 1.0) return 'text-yellow-600';
    if (ratio < 0.8) return 'text-green-600';
    return 'text-gray-600';
  };

  const getLabel = () => {
    if (ratio > 1.5) return 'HIGH IMPACT';
    if (ratio < 0.8) return 'Less Affected';
    return '';
  };

  return (
    <span className={`font-bold text-lg ${getColor()}`}>
      {ratio.toFixed(2)}x
      {showLabel && getLabel() && (
        <div className="text-xs mt-1">{getLabel()}</div>
      )}
    </span>
  );
};