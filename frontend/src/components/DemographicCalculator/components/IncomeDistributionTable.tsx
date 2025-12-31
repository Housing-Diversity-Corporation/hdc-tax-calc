import React from 'react';
import { ACS_RENTER_BINS } from '../../../lib/affordability';
import type { DemographicImpact, GroupDist } from '../types';

interface IncomeDistributionTableProps {
  demographicImpact: Record<string, DemographicImpact>;
  groupDists: GroupDist;
  baseRent: number;
  requiredRent: number;
}

export const IncomeDistributionTable: React.FC<IncomeDistributionTableProps> = ({
  demographicImpact,
  groupDists,
  baseRent,
  requiredRent
}) => {
  return (
    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
      <h3 className="text-md font-semibold text-blue-900 mb-3">
        Income Distribution by Race/Ethnicity
      </h3>
      <p className="text-xs text-gray-600 mb-3">
        Number of households in each income bracket, by demographic group
      </p>
      
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left py-2 px-2 font-medium text-gray-700">Income Range</th>
              <th className="text-center py-2 px-2 font-medium text-gray-600">
                Max Rent<br/>(30% income)
              </th>
              {Object.keys(demographicImpact).map(group => (
                <th key={group} className="text-center py-2 px-2 font-medium text-gray-700">
                  {group.split(' ').map(word => word.substring(0, 3)).join(' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ACS_RENTER_BINS.map((bin: [number, number|null], idx: number) => {
              const [lo, hi] = bin;
              const midIncome = hi ? (lo + hi) / 2 : lo;
              const maxRent = (midIncome * 0.30) / 12;
              const canAffordBase = maxRent >= baseRent;
              const canAffordRequired = maxRent >= requiredRent;
              
              // Determine if this income bracket is in the "exclusion zone"
              const inExclusionZone = canAffordBase && !canAffordRequired;
              
              return (
                <tr key={idx} className={`border-b ${
                  inExclusionZone ? 'bg-red-100' :
                  canAffordRequired ? 'bg-green-50' :
                  'bg-gray-50'
                }`}>
                  <td className="py-1 px-2 text-xs font-medium">
                    ${lo.toLocaleString()}{hi ? `-${hi.toLocaleString()}` : '+'}
                  </td>
                  <td className="py-1 px-2 text-center text-xs">
                    ${maxRent.toFixed(0)}
                    {inExclusionZone && (
                      <div className="text-red-600 font-semibold">EXCLUDED</div>
                    )}
                  </td>
                  {Object.entries(demographicImpact).map(([group, data]) => {
                    const groupDist = groupDists[group];
                    const count = groupDist?.[idx] || 0;
                    const pctOfGroup = data.total > 0 ? (count / data.total) * 100 : 0;
                    
                    return (
                      <td key={group} className="py-1 px-2 text-center text-xs">
                        {count > 0 ? (
                          <>
                            <div className="font-medium">{count.toFixed(0)}</div>
                            <div className="text-gray-500">({pctOfGroup.toFixed(0)}%)</div>
                          </>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {/* Total row */}
            <tr className="border-t-2 border-gray-400 font-semibold">
              <td className="py-2 px-2 text-xs">TOTAL</td>
              <td className="py-2 px-2"></td>
              {Object.entries(demographicImpact).map(([group, data]) => (
                <td key={group} className="py-2 px-2 text-center text-xs">
                  {data.total.toFixed(0)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="mt-3 p-2 bg-white rounded">
        <p className="text-xs text-gray-600">
          <span className="inline-block w-4 h-3 bg-red-100 rounded mr-1"></span> 
          <strong>Red rows</strong> = Income levels that can afford baseline rent but NOT the required rent (excluded by policies)
        </p>
        <p className="text-xs text-gray-600 mt-1">
          <span className="inline-block w-4 h-3 bg-green-50 rounded mr-1"></span> 
          <strong>Green rows</strong> = Can afford even with policy costs added
        </p>
      </div>
    </div>
  );
};