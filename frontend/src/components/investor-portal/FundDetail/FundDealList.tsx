import React from 'react';
import type { DealBenefitProfile } from '../../../types/dealBenefitProfile';

interface FundDealListProps {
  deals: DealBenefitProfile[];
  poolStartYear?: number;
}

const FundDealList: React.FC<FundDealListProps> = ({ deals, poolStartYear }) => {
  if (deals.length === 0) return null;

  const formatCurrency = (value: number) => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-[#474a44] mb-2">Member Deals</h3>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-[#474a44]/70 text-xs">
              <th className="px-4 py-2 text-left font-medium">Deal</th>
              <th className="px-4 py-2 text-left font-medium">State</th>
              <th className="px-4 py-2 text-right font-medium">Entry Year</th>
              <th className="px-4 py-2 text-right font-medium">Offset</th>
              <th className="px-4 py-2 text-right font-medium">Hold</th>
              <th className="px-4 py-2 text-right font-medium">Gross Equity</th>
              <th className="px-4 py-2 text-right font-medium">Project Cost</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((deal, idx) => {
              const offset = poolStartYear != null ? deal.fundYear - poolStartYear : 0;
              return (
                <tr key={deal.id || idx} className="border-t border-gray-100 hover:bg-gray-50/50">
                  <td className="px-4 py-2 font-medium text-[#474a44]">{deal.dealName}</td>
                  <td className="px-4 py-2 text-[#474a44]/70">{deal.propertyState}</td>
                  <td className="px-4 py-2 text-right text-[#407f7f] font-medium">{deal.fundYear}</td>
                  <td className="px-4 py-2 text-right text-[#474a44]/60">+{offset}yr</td>
                  <td className="px-4 py-2 text-right text-[#474a44]/70">{deal.holdPeriod}yr</td>
                  <td className="px-4 py-2 text-right font-medium text-[#474a44]">{formatCurrency(deal.grossEquity)}</td>
                  <td className="px-4 py-2 text-right text-[#474a44]/70">{formatCurrency(deal.projectCost)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FundDealList;
