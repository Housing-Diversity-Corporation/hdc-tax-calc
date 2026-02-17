import React from 'react';
import type { FundSizingResult } from '../../../types/fundSizing';

interface OptimalCommitmentCardProps {
  result: FundSizingResult;
}

const OptimalCommitmentCard: React.FC<OptimalCommitmentCardProps> = ({ result }) => {
  const formatCurrency = (value: number) => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const fitColor = result.fullUtilizationResult.fitIndicator === 'green'
    ? '#7fbd45'
    : result.fullUtilizationResult.fitIndicator === 'yellow'
    ? '#f59e0b'
    : '#ef4444';

  const peakLabel = result.peakType === 'peak'
    ? 'Optimal commitment — above this, benefits begin to suspend'
    : result.peakType === 'plateau'
    ? 'Benefits fully utilized up to this amount — commitment is capacity-unconstrained'
    : 'Tax capacity exceeds fund size — investor can absorb the maximum allocation';

  return (
    <div className="mb-6 border border-gray-200 rounded-lg p-5 bg-white">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-semibold text-[#474a44]">Sizing Recommendation</h3>
        <span className="px-2 py-0.5 text-[10px] rounded font-medium text-white" style={{ backgroundColor: fitColor }}>
          {result.fullUtilizationResult.fitIndicator}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4">
        <div>
          <div className="text-xs text-[#474a44]/60 mb-1">Optimal Commitment</div>
          <div className="text-xl font-bold text-[#407f7f]">{formatCurrency(result.optimalCommitment)}</div>
        </div>
        <div>
          <div className="text-xs text-[#474a44]/60 mb-1">Total Tax Savings</div>
          <div className="text-xl font-bold text-[#7fbd45]">{formatCurrency(result.optimalTaxSavings)}</div>
        </div>
        <div>
          <div className="text-xs text-[#474a44]/60 mb-1">Savings / Dollar</div>
          <div className="text-xl font-bold text-[#474a44]">${result.optimalSavingsPerDollar.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-xs text-[#474a44]/60 mb-1">Utilization Rate</div>
          <div className="text-xl font-bold text-[#474a44]">{(result.optimalUtilizationRate * 100).toFixed(0)}%</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          result.peakType === 'peak' ? 'bg-[#407f7f]' :
          result.peakType === 'plateau' ? 'bg-[#7fbd45]' :
          'bg-[#7fbd45]'
        }`} />
        <span className="text-xs text-[#474a44]/70">{peakLabel}</span>
      </div>

      <div className="text-xs text-[#474a44]/50 mt-2">
        Pro-rata share: {(result.optimalProRataShare * 100).toFixed(1)}% of fund
      </div>
    </div>
  );
};

export default OptimalCommitmentCard;
