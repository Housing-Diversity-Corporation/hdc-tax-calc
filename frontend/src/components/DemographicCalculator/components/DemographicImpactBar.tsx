import React from 'react';
import type { DemographicImpact } from '../types';

interface DemographicImpactBarProps {
  group: string;
  data: DemographicImpact;
  baseRent: number;
  requiredRent: number;
}

export const DemographicImpactBar: React.FC<DemographicImpactBarProps> = ({
  group,
  data,
  baseRent,
  requiredRent
}) => {
  const totalHouseholds = data.total;
  const cantAffordBase = totalHouseholds - data.canAffordBase;
  const excludedByPolicies = data.excluded;
  const canAfford = data.canAffordRequired;
  
  // Calculate percentages for bar segments
  const baselineExcludedPct = (cantAffordBase / totalHouseholds) * 100;
  const policyExcludedPct = (excludedByPolicies / totalHouseholds) * 100;
  const canAffordPct = (canAfford / totalHouseholds) * 100;
  const totalExcludedPct = baselineExcludedPct + policyExcludedPct;

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{group}</span>
          {data.disparityRatio > 1.5 && (
            <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded">
              {data.disparityRatio.toFixed(1)}x impact
            </span>
          )}
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-600">
            {baselineExcludedPct.toFixed(0)}% can't afford baseline
          </span>
          {policyExcludedPct > 0 && (
            <span className="text-xs text-red-600 font-bold ml-2">
              +{policyExcludedPct.toFixed(0)}% excluded by policies
            </span>
          )}
        </div>
      </div>
      
      {/* Single bar with three segments */}
      <div className="relative h-8 bg-gray-200 rounded overflow-hidden">
        {/* Can't afford baseline - dark gray */}
        {baselineExcludedPct > 0 && (
          <div 
            className="absolute left-0 h-full bg-gray-600"
            style={{ width: `${baselineExcludedPct}%` }}
            title={`${cantAffordBase.toFixed(0)} households can't afford baseline`}
          />
        )}
        
        {/* Excluded by policies - red with stripes */}
        {policyExcludedPct > 0 && (
          <div 
            className="absolute h-full"
            style={{ 
              left: `${baselineExcludedPct}%`,
              width: `${policyExcludedPct}%`,
              background: 'repeating-linear-gradient(45deg, #DC2626, #DC2626 4px, #EF4444 4px, #EF4444 8px)'
            }}
            title={`${excludedByPolicies.toFixed(0)} households excluded by policy costs`}
          />
        )}
        
        {/* Can afford with policies - green */}
        {canAffordPct > 0 && (
          <div 
            className="absolute right-0 h-full"
            style={{ 
              width: `${canAffordPct}%`,
              backgroundColor: 'var(--hdc-faded-jade)'
            }}
            title={`${canAfford.toFixed(0)} households can still afford`}
          />
        )}
        
        {/* Labels inside bar if space permits */}
        <div className="relative h-full flex items-center px-2 pointer-events-none">
          {baselineExcludedPct > 15 && (
            <span className="text-xs text-white font-medium">
              {baselineExcludedPct.toFixed(0)}%
            </span>
          )}
          {policyExcludedPct > 15 && (
            <span className="text-xs text-white font-bold ml-auto mr-auto">
              +{policyExcludedPct.toFixed(0)}%
            </span>
          )}
          {canAffordPct > 15 && (
            <span className="text-xs text-white font-medium ml-auto">
              {canAffordPct.toFixed(0)}%
            </span>
          )}
        </div>
      </div>
      
      {/* Income range indicators */}
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-500">$0</span>
        <span className="text-xs text-gray-600 font-medium">
          ${(baseRent * 12 / 0.30 / 1000).toFixed(0)}k
        </span>
        <span className="text-xs text-red-600 font-medium">
          ${(requiredRent * 12 / 0.30 / 1000).toFixed(0)}k
        </span>
        <span className="text-xs text-gray-500">$150k+</span>
      </div>
      
      {/* Annotation showing what each section represents */}
      <div className="mt-2 text-xs text-gray-600">
        <span className="font-medium">{totalExcludedPct.toFixed(0)}% total excluded</span>
        {baselineExcludedPct > 0 && (
          <span> ({baselineExcludedPct.toFixed(0)}% at baseline</span>
        )}
        {policyExcludedPct > 0 && (
          <span>, +{policyExcludedPct.toFixed(0)}% from policies)</span>
        )}
      </div>
    </div>
  );
};