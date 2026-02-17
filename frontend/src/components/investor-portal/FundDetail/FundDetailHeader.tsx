import React from 'react';
import { Button } from '../../ui/button';
import { ArrowLeft } from 'lucide-react';
import type { InvestmentPool } from '../../../types/dealBenefitProfile';
import type { PoolAggregationMeta } from '../../../types/fundSizing';

interface FundDetailHeaderProps {
  pool: InvestmentPool | null;
  meta: PoolAggregationMeta | null;
  onBack?: () => void;
}

const FundDetailHeader: React.FC<FundDetailHeaderProps> = ({ pool, meta, onBack }) => {
  if (!pool) return null;

  return (
    <div className="border-b border-gray-200 pb-4 mb-6">
      <div className="flex items-center gap-3 mb-2">
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-[#407f7f] hover:bg-[#92c3c2]/20"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        )}
        <h1 className="text-2xl font-bold text-[#474a44]">{pool.poolName}</h1>
        <span className={`px-2 py-0.5 text-xs rounded font-medium ${
          pool.status === 'funded' ? 'bg-[#7fbd45] text-white' :
          pool.status === 'committed' ? 'bg-[#407f7f] text-white' :
          'bg-gray-200 text-[#474a44]'
        }`}>
          {pool.status}
        </span>
      </div>
      {pool.description && (
        <p className="text-sm text-[#474a44]/70 mb-2">{pool.description}</p>
      )}
      {meta && (
        <div className="flex gap-6 text-xs text-[#474a44]/60">
          <span><strong className="text-[#407f7f]">{meta.dealCount}</strong> deals</span>
          <span>Calendar: <strong className="text-[#407f7f]">{meta.poolStartYear}</strong> &ndash; <strong className="text-[#407f7f]">{meta.poolEndYear}</strong></span>
          <span>Horizon: <strong className="text-[#407f7f]">{meta.consolidatedHorizon}</strong> years</span>
          <span>Total Equity: <strong className="text-[#407f7f]">${(meta.totalGrossEquity / 1_000_000).toFixed(1)}M</strong></span>
        </div>
      )}
    </div>
  );
};

export default FundDetailHeader;
