/**
 * IRAConversionPanel (IMPL-147 + IMPL-150)
 *
 * Displays IRA-to-Roth conversion opportunity for REP investors with IRA balances.
 * Shows rate compression, strategy comparison, lifetime value, and recommendations.
 *
 * Only renders when: investorTrack === 'rep' && iraBalance > 0 && conversion plan exists.
 */

import React from 'react';
import type { IRAConversionPlan } from '../../../types/taxbenefits';

interface IRAConversionPanelProps {
  conversionPlan: IRAConversionPlan;
  preHDCRate: number;       // Marginal rate before HDC losses (%)
  postHDCRate: number;      // Effective rate after HDC losses in Year 1 (%)
  year1TaxSavings?: number; // IMPL-150: Absolute dollar savings in Year 1
  iraBalance: number;
  holdPeriod: number;
  // IMPL-150: Strategy comparison
  strategies?: {
    aggressive: IRAConversionPlan | undefined;
    balanced: IRAConversionPlan | undefined;
    conservative: IRAConversionPlan | undefined;
    recommendation: string;
  };
  // IMPL-150: Lifetime value analysis
  lifetimeValue?: {
    immediateValue: number;
    futureValue: number;
    breakEvenYear: number;
    lifetimeAdvantage: number;
  };
  // IMPL-150: Text recommendations
  recommendations?: string[];
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
  year1TaxSavings,
  iraBalance,
  holdPeriod,
  strategies,
  lifetimeValue,
  recommendations,
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

      {/* Section 1: Rate Compression */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-4">
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
        {year1TaxSavings != null && year1TaxSavings > 0 && (
          <div>
            <div className="text-xs text-[#474a44]/60 mb-1">Year 1 Tax Savings</div>
            <div className="text-lg font-bold text-[#7fbd45]">{formatCompactCurrency(year1TaxSavings)}</div>
          </div>
        )}
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

      {/* Section 2: Strategy Comparison (IMPL-150) */}
      {strategies && (strategies.aggressive || strategies.balanced || strategies.conservative) && (
        <div className="mb-4">
          <div className="text-xs font-semibold text-[#474a44]/70 mb-2">Conversion Strategy Comparison</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#f0f7f7]">
                  <th className="text-left p-2 border-b border-gray-200" />
                  <th className="text-right p-2 border-b border-gray-200">Aggressive (3 yr)</th>
                  <th className="text-right p-2 border-b border-gray-200">Balanced (5 yr)</th>
                  <th className="text-right p-2 border-b border-gray-200">Conservative (7 yr)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="p-2 text-[#474a44]/70">Total Converted</td>
                  <td className="p-2 text-right font-medium">{strategies.aggressive ? formatCompactCurrency(strategies.aggressive.totalConverted) : '--'}</td>
                  <td className="p-2 text-right font-medium">{strategies.balanced ? formatCompactCurrency(strategies.balanced.totalConverted) : '--'}</td>
                  <td className="p-2 text-right font-medium">{strategies.conservative ? formatCompactCurrency(strategies.conservative.totalConverted) : '--'}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="p-2 text-[#474a44]/70">Tax Saved</td>
                  <td className="p-2 text-right font-medium text-[#7fbd45]">{strategies.aggressive ? formatCompactCurrency(strategies.aggressive.totalTaxSaved) : '--'}</td>
                  <td className="p-2 text-right font-medium text-[#7fbd45]">{strategies.balanced ? formatCompactCurrency(strategies.balanced.totalTaxSaved) : '--'}</td>
                  <td className="p-2 text-right font-medium text-[#7fbd45]">{strategies.conservative ? formatCompactCurrency(strategies.conservative.totalTaxSaved) : '--'}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="p-2 text-[#474a44]/70">Yr 30 Roth Value</td>
                  <td className="p-2 text-right font-medium">{strategies.aggressive ? formatCompactCurrency(strategies.aggressive.year30RothValue) : '--'}</td>
                  <td className="p-2 text-right font-medium">{strategies.balanced ? formatCompactCurrency(strategies.balanced.year30RothValue) : '--'}</td>
                  <td className="p-2 text-right font-medium">{strategies.conservative ? formatCompactCurrency(strategies.conservative.year30RothValue) : '--'}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-xs text-[#407f7f] font-medium">
            {strategies.recommendation}
          </div>
        </div>
      )}

      {/* Section 3: Lifetime Value (IMPL-150) */}
      {lifetimeValue && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 bg-[#f8faf5] rounded-md mb-4">
          <div>
            <div className="text-xs text-[#474a44]/60 mb-1">Immediate Value</div>
            <div className="text-base font-bold text-[#7fbd45]">
              {formatCompactCurrency(lifetimeValue.immediateValue)}
            </div>
            <div className="text-xs text-[#474a44]/50">tax saved on conversion</div>
          </div>
          <div>
            <div className="text-xs text-[#474a44]/60 mb-1">Future Value</div>
            <div className="text-base font-bold text-[#407f7f]">
              {formatCompactCurrency(lifetimeValue.futureValue)}
            </div>
            <div className="text-xs text-[#474a44]/50">tax-free growth to Yr 30</div>
          </div>
          <div>
            <div className="text-xs text-[#474a44]/60 mb-1">Break-Even Year</div>
            <div className="text-base font-bold text-[#474a44]">
              Year {lifetimeValue.breakEvenYear}
            </div>
            <div className="text-xs text-[#474a44]/50">Roth outperforms Traditional</div>
          </div>
          <div>
            <div className="text-xs text-[#474a44]/60 mb-1">Lifetime Advantage</div>
            <div className="text-base font-bold text-[#7fbd45]">
              {formatCompactCurrency(lifetimeValue.lifetimeAdvantage)}
            </div>
            <div className="text-xs text-[#474a44]/50">vs. no conversion</div>
          </div>
        </div>
      )}

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

      {/* Section 4: Recommendations (IMPL-150) */}
      {recommendations && recommendations.length > 0 && (
        <div className="mb-3 p-3 bg-[#f9fafb] rounded-md border border-gray-100">
          <div className="text-xs font-semibold text-[#474a44]/70 mb-2">Recommendations</div>
          <ul className="list-disc list-inside space-y-1">
            {recommendations.map((rec, idx) => (
              <li key={idx} className="text-xs text-[#474a44]/80">{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default IRAConversionPanel;
