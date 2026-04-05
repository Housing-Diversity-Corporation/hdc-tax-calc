/**
 * IRAConversionPanel (IMPL-147)
 *
 * Displays IRA-to-Roth conversion opportunity for REP investors with IRA balances.
 * Shows rate compression from HDC depreciation and optimal conversion amount.
 *
 * Only renders when: investorTrack === 'rep' && iraBalance > 0 && conversion plan exists.
 */

import React from 'react';
import type { IRAConversionPlan } from '../../../types/taxbenefits';

interface IRAConversionPanelProps {
  conversionPlan: IRAConversionPlan;
  preHDCRate: number;       // Marginal rate before HDC losses (%)
  postHDCRate: number;      // Effective rate after HDC losses in Year 1 (%)
  iraBalance: number;
  holdPeriod: number;
}

function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

const IRAConversionPanel: React.FC<IRAConversionPanelProps> = ({
  conversionPlan,
  preHDCRate,
  postHDCRate,
  iraBalance,
  holdPeriod,
}) => {
  const rateCompression = preHDCRate - postHDCRate;
  const conversionYears = conversionPlan.schedule.length;

  return (
    <div className="mb-6 border border-gray-200 rounded-lg p-5 bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-sm font-semibold text-[#474a44]">IRA Conversion Opportunity</h3>
        <span className="px-3 py-1 text-xs rounded-full font-semibold text-white bg-[#407f7f]">
          REP Advantage
        </span>
      </div>

      <p className="text-xs text-[#474a44]/70 mb-4">
        HDC depreciation losses create a window to convert Traditional IRA to Roth at a compressed tax rate.
        Conversion income is offset by §461(l)-allowed losses during the hold period.
      </p>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        <div>
          <div className="text-xs text-[#474a44]/60 mb-1">Pre-HDC Marginal Rate</div>
          <div className="text-lg font-bold text-[#474a44]">{preHDCRate.toFixed(1)}%</div>
        </div>
        <div>
          <div className="text-xs text-[#474a44]/60 mb-1">Post-HDC Effective Rate</div>
          <div className="text-lg font-bold text-[#407f7f]">{postHDCRate.toFixed(1)}%</div>
        </div>
        <div>
          <div className="text-xs text-[#474a44]/60 mb-1">Rate Compression</div>
          <div className="text-lg font-bold text-[#7fbd45]">{rateCompression.toFixed(1)} pts</div>
        </div>
        <div>
          <div className="text-xs text-[#474a44]/60 mb-1">Conversion Window</div>
          <div className="text-lg font-bold text-[#474a44]">{conversionYears} years</div>
        </div>
      </div>

      {/* Conversion Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-3 bg-[#f0f7f7] rounded-md mb-4">
        <div>
          <div className="text-xs text-[#474a44]/60 mb-1">Optimal Conversion Amount</div>
          <div className="text-base font-bold text-[#407f7f]">
            {formatCompactCurrency(conversionPlan.totalConverted)}
          </div>
          <div className="text-xs text-[#474a44]/50">
            of {formatCompactCurrency(iraBalance)} balance
          </div>
        </div>
        <div>
          <div className="text-xs text-[#474a44]/60 mb-1">Estimated Tax Savings</div>
          <div className="text-base font-bold text-[#7fbd45]">
            {formatCompactCurrency(conversionPlan.totalTaxSaved)}
          </div>
          <div className="text-xs text-[#474a44]/50">
            vs. converting without HDC
          </div>
        </div>
        <div>
          <div className="text-xs text-[#474a44]/60 mb-1">Projected Roth Value (Yr 30)</div>
          <div className="text-base font-bold text-[#474a44]">
            {formatCompactCurrency(conversionPlan.year30RothValue)}
          </div>
          <div className="text-xs text-[#474a44]/50">
            at 7% annual growth
          </div>
        </div>
      </div>

      {/* Conversion Schedule */}
      {conversionPlan.schedule.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-semibold text-[#474a44]/70 mb-2">Annual Conversion Schedule</div>
          <div className="grid gap-1">
            {conversionPlan.schedule.map((yr) => (
              <div key={yr.year} className="flex items-center text-xs gap-2">
                <span className="text-[#474a44]/60 w-12">Year {yr.year}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#407f7f]"
                    style={{
                      width: `${Math.min(100, (yr.recommendedConversion / conversionPlan.totalConverted) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-[#474a44] font-medium w-16 text-right">
                  {formatCompactCurrency(yr.recommendedConversion)}
                </span>
                <span className="text-[#7fbd45] font-medium w-16 text-right">
                  +{formatCompactCurrency(yr.taxSaved)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-[#474a44]/50 italic">
        Full modeling of multi-year conversion trajectories is on the HDC platform roadmap.
      </p>
    </div>
  );
};

export default IRAConversionPanel;
