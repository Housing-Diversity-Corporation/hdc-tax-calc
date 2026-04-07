/**
 * SizingOptimizerPanel (IMPL-106)
 *
 * Interactive commitment slider with utilization curve chart.
 * Renders on Deal Detail below FitSummaryPanel.
 * Only visible when investor profile is applied and sizing result is available.
 *
 * Uses recharts for the utilization curve visualization.
 */

import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import type { InvestorFitResult, Archetype } from '../../../utils/taxbenefits/investorFit';
import type { SizingResult, SizingPoint, LifetimeCoverageResult } from '../../../utils/taxbenefits/investorSizing';

type SizingMode = 'annual' | 'lifetime';

interface SizingOptimizerPanelProps {
  sizingResult: SizingResult;
  year1TaxReduction?: number | null; // IMPL-153: depTaxSavings + lihtcUsable (dollars)
  fitResult: InvestorFitResult;
  currentCommitment: number;
  onCommitmentChange: (value: number) => void;
  minSlider: number;
  maxSlider: number;
  formatCurrency: (value: number) => string;
  // IMPL-152: Lifetime Coverage Mode
  isNonpassive?: boolean;
  lifetimeCoverageResult?: LifetimeCoverageResult | null;
  onLifetimeCoverageRequest?: (low: number, high: number, dist: 'conservative' | 'moderate' | 'optimistic') => void;
  // IMPL-157: AMT exposure advisor note
  hasMaterialAmtExposure?: boolean;
}

// =============================================================================
// Helpers
// =============================================================================

const BADGE_COLORS: Record<Archetype, string> = {
  A: '#7fbd45',
  B: '#407f7f',
  C: '#2dd4bf',
  D: '#f59e0b',
  E: '#ef4444',
};

function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

/**
 * Find the SizingPoint closest to a given commitment amount.
 */
function findClosestPoint(curve: SizingPoint[], commitment: number): SizingPoint | null {
  if (curve.length === 0) return null;
  let closest = curve[0];
  let minDist = Math.abs(curve[0].commitmentAmount - commitment);
  for (const pt of curve) {
    const dist = Math.abs(pt.commitmentAmount - commitment);
    if (dist < minDist) {
      minDist = dist;
      closest = pt;
    }
  }
  return closest;
}

// =============================================================================
// Archetype E Modified Display
// =============================================================================

const ArchetypeEDisplay: React.FC<{
  fitResult: InvestorFitResult;
  formatCurrency: (value: number) => string;
}> = ({ fitResult, formatCurrency }) => (
  <div className="mb-6 border border-gray-200 rounded-lg p-5 bg-white">
    <div className="flex items-center gap-3 mb-4">
      <h3 className="text-sm font-semibold text-[#474a44]">Investment Sizing</h3>
      <span
        className="px-3 py-1 text-xs rounded-full font-semibold text-white"
        style={{ backgroundColor: '#ef4444' }}
      >
        Poor for Annual
      </span>
      <span className="text-xs text-[#474a44]/70">W-2 Only</span>
    </div>

    <div className="text-xs text-[#474a44]/60 mb-1">
      Binding Constraint: §469(a) No Passive Income
    </div>

    <div className="my-4 p-3 rounded-md bg-amber-50 border border-amber-200">
      <p className="text-sm text-amber-800 font-medium">
        Annual tax benefits would be suspended (not lost). Benefits release at disposition.
      </p>
    </div>

    <div className="grid grid-cols-3 gap-4">
      <div>
        <div className="text-xs text-[#474a44]/60 mb-1">Annual Utilization</div>
        <div className="text-lg font-bold text-[#474a44]">~0%</div>
      </div>
      <div>
        <div className="text-xs text-[#474a44]/60 mb-1">Disposition Release Value</div>
        <div className="text-lg font-bold text-[#407f7f]">
          {formatCurrency(fitResult.dispositionReleaseEstimate)}
        </div>
      </div>
      <div>
        <div className="text-xs text-[#474a44]/60 mb-1">Total Hold-Period Return</div>
        <div className="text-lg font-bold text-[#474a44]">
          {fitResult.effectiveMultiple.toFixed(2)}x multiple
        </div>
      </div>
    </div>
  </div>
);

// =============================================================================
// Standard Sizing Display (Archetypes A–D)
// =============================================================================

const SizingOptimizerPanel: React.FC<SizingOptimizerPanelProps> = ({
  sizingResult,
  fitResult,
  currentCommitment,
  onCommitmentChange,
  minSlider,
  maxSlider,
  formatCurrency,
  isNonpassive,
  lifetimeCoverageResult,
  onLifetimeCoverageRequest,
  year1TaxReduction,
  hasMaterialAmtExposure,
}) => {
  // IMPL-152: Lifetime Coverage Mode state
  const [sizingMode, setSizingMode] = useState<SizingMode>('annual');
  const [lowIncome, setLowIncome] = useState<string>('200000');
  const [highIncome, setHighIncome] = useState<string>('800000');
  const [incomeDist, setIncomeDist] = useState<'conservative' | 'moderate' | 'optimistic'>('moderate');

  // For Archetype E, show the modified display
  if (fitResult.archetype === 'E') {
    return <ArchetypeEDisplay fitResult={fitResult} formatCurrency={formatCurrency} />;
  }

  const badgeColor = BADGE_COLORS[fitResult.archetype];

  // Chart data: transform SizingPoints for recharts
  const chartData = useMemo(() =>
    sizingResult.utilizationCurve.map(pt => ({
      commitment: pt.commitmentAmount,
      annualUtil: Math.round(pt.annualUtilizationPct * 10) / 10,
      creditUtil: Math.round(pt.creditUtilizationPct * 10) / 10,
      label: formatCompactCurrency(pt.commitmentAmount),
    })),
    [sizingResult.utilizationCurve]
  );

  // Current point from curve
  const currentPoint = findClosestPoint(sizingResult.utilizationCurve, currentCommitment);

  // IMPL-152: Handle mode switch to Lifetime Coverage
  const handleLifetimeCoverageRun = () => {
    const low = Number(lowIncome) || 200_000;
    const high = Number(highIncome) || 800_000;
    if (onLifetimeCoverageRequest) {
      onLifetimeCoverageRequest(low, high, incomeDist);
    }
  };

  return (
    <div className="mb-6 border border-gray-200 rounded-lg p-5 bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-sm font-semibold text-[#474a44]">Investment Sizing</h3>
        <span
          className="px-3 py-1 text-xs rounded-full font-semibold text-white"
          style={{ backgroundColor: badgeColor }}
        >
          {fitResult.archetypeLabel}
        </span>
        <span className="text-xs text-[#474a44]/60 ml-auto">
          Constraint: {sizingResult.constraintBinding}
        </span>
      </div>

      {/* IMPL-152: Mode Toggle — REP (nonpassive) only */}
      {isNonpassive && onLifetimeCoverageRequest && (
        <div className="flex gap-1 mb-4 p-0.5 bg-gray-100 rounded-md w-fit">
          <button
            onClick={() => setSizingMode('annual')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              sizingMode === 'annual'
                ? 'bg-white text-[#407f7f] shadow-sm'
                : 'text-[#474a44]/60 hover:text-[#474a44]'
            }`}
          >
            Annual Efficiency
          </button>
          <button
            onClick={() => { setSizingMode('lifetime'); handleLifetimeCoverageRun(); }}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              sizingMode === 'lifetime'
                ? 'bg-white text-[#407f7f] shadow-sm'
                : 'text-[#474a44]/60 hover:text-[#474a44]'
            }`}
          >
            Lifetime Coverage
          </button>
        </div>
      )}

      {/* ═══ Annual Efficiency mode content ═══ */}
      {sizingMode === 'annual' && <>

      {/* Commitment Slider */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-[#474a44]/60">{formatCompactCurrency(minSlider)}</span>
          <span className="text-sm font-semibold text-[#407f7f]">
            {formatCompactCurrency(currentCommitment)}
          </span>
          <span className="text-xs text-[#474a44]/60">{formatCompactCurrency(maxSlider)}</span>
        </div>
        <input
          type="range"
          min={minSlider}
          max={maxSlider}
          step={Math.max(1000, Math.round((maxSlider - minSlider) / 100))}
          value={currentCommitment}
          onChange={(e) => onCommitmentChange(Number(e.target.value))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #407f7f ${
              ((currentCommitment - minSlider) / (maxSlider - minSlider)) * 100
            }%, #e5e7eb ${
              ((currentCommitment - minSlider) / (maxSlider - minSlider)) * 100
            }%)`,
          }}
        />
      </div>

      {/* Optimal callout */}
      <div className="flex flex-wrap gap-4 mb-4 text-xs">
        <div>
          <span className="text-[#474a44]/60">Optimal (Efficiency): </span>
          <span className="font-semibold text-[#407f7f]">
            {formatCompactCurrency(sizingResult.optimalCommitment)}
          </span>
        </div>
        {/* IMPL-145: §461(l) REP optimal — only for nonpassive investors */}
        {sizingResult.sec461lOptimalCommitment != null && (
          <div>
            <span className="text-[#474a44]/60">Optimal (§461(l) REP): </span>
            <span className="font-semibold text-[#d97706]">
              {formatCompactCurrency(sizingResult.sec461lOptimalCommitment)}
            </span>
            {sizingResult.sec461lUtilizationPct != null && (
              <span className="text-[#474a44]/50">
                {' '}({sizingResult.sec461lUtilizationPct.toFixed(0)}% util)
              </span>
            )}
          </div>
        )}
        {sizingResult.minimumEffective > 0 && sizingResult.maximumEffective > 0 && (
          <div>
            <span className="text-[#474a44]/60">Effective Range: </span>
            <span className="font-medium text-[#474a44]">
              {formatCompactCurrency(sizingResult.minimumEffective)} – {formatCompactCurrency(sizingResult.maximumEffective)}
            </span>
            <span className="text-[#474a44]/50"> (&gt;80% utilization)</span>
          </div>
        )}
      </div>

      {/* Utilization Curve Chart */}
      {chartData.length > 0 && (
        <div className="mb-4">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="commitment"
                tickFormatter={formatCompactCurrency}
                tick={{ fontSize: 10, fill: '#474a44' }}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 10, fill: '#474a44' }}
              />
              <Tooltip
                formatter={(value: any, name: any) => [
                  `${(Number(value) || 0).toFixed(1)}%`,
                  name === 'annualUtil' ? 'Annual Utilization' : 'Credit Utilization',
                ]}
                labelFormatter={(label: any) => `Commitment: ${formatCompactCurrency(label)}`}
              />
              {/* Effective range shading */}
              {sizingResult.minimumEffective > 0 && sizingResult.maximumEffective > 0 && (
                <ReferenceArea
                  x1={sizingResult.minimumEffective}
                  x2={sizingResult.maximumEffective}
                  fill="#407f7f"
                  fillOpacity={0.08}
                />
              )}
              {/* Optimal commitment line */}
              <ReferenceLine
                x={sizingResult.optimalCommitment}
                stroke="#7fbd45"
                strokeDasharray="4 4"
                label={{ value: 'Optimal', position: 'top', fontSize: 10, fill: '#7fbd45' }}
              />
              {/* IMPL-145: §461(l) REP target line */}
              {sizingResult.sec461lOptimalCommitment != null && (
                <ReferenceLine
                  x={sizingResult.sec461lOptimalCommitment}
                  stroke="#d97706"
                  strokeDasharray="4 4"
                  label={{ value: '§461(l)', position: 'top', fontSize: 10, fill: '#d97706' }}
                />
              )}
              {/* Current commitment line */}
              {currentCommitment !== sizingResult.optimalCommitment && (
                <ReferenceLine
                  x={currentCommitment}
                  stroke="#407f7f"
                  strokeDasharray="2 2"
                />
              )}
              <Line
                type="monotone"
                dataKey="annualUtil"
                stroke="#407f7f"
                strokeWidth={2}
                dot={false}
                name="annualUtil"
              />
              <Line
                type="monotone"
                dataKey="creditUtil"
                stroke="#92c3c2"
                strokeWidth={1.5}
                dot={false}
                name="creditUtil"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      </>}
      {/* ═══ End Annual Efficiency mode content ═══ */}

      {/* Metrics at Current Commitment — Annual Efficiency mode */}
      {sizingMode === 'annual' && currentPoint && (
        <div className="grid grid-cols-6 gap-3">
          {/* IMPL-153: Year 1 Tax Reduction — most concrete investor-facing metric */}
          {year1TaxReduction != null && (
            <div>
              <div className="text-xs text-[#474a44]/60 mb-1">Year 1 Tax Reduction</div>
              <div className="text-base font-bold text-[#7fbd45]">
                {formatCurrency(year1TaxReduction)}
              </div>
            </div>
          )}
          <div>
            <div className="text-xs text-[#474a44]/60 mb-1">Annual Utilization</div>
            <div className="text-base font-bold text-[#474a44]">
              {currentPoint.annualUtilizationPct.toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-xs text-[#474a44]/60 mb-1">Credit Utilization</div>
            <div className="text-base font-bold text-[#474a44]">
              {currentPoint.creditUtilizationPct.toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-xs text-[#474a44]/60 mb-1">Depr. Utilization</div>
            <div className="text-base font-bold text-[#474a44]">
              {currentPoint.depreciationUtilizationPct.toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-xs text-[#474a44]/60 mb-1">Effective Multiple</div>
            <div className="text-base font-bold text-[#474a44]">
              {currentPoint.effectiveMultiple.toFixed(2)}x
            </div>
          </div>
          <div>
            <div className="text-xs text-[#474a44]/60 mb-1">Util-Adjusted IRR</div>
            <div className="text-base font-bold text-[#474a44]">
              {fitResult.utilizationAdjustedIRR.toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {/* IMPL-157: AMT exposure advisor note */}
      {hasMaterialAmtExposure && (
        <div className="mt-3 p-3 rounded-md bg-amber-50 border border-amber-200">
          <p className="text-xs text-amber-800">
            <span className="font-semibold">&#x26A0;&#xFE0F; AMT Exposure Note:</span>{' '}
            This investor has indicated material AMT exposure from sources outside this
            investment. Note: AMT does not affect utilization of LIHTC credits from this
            investment — §38(c)(4)(B)(iii) specifically exempts credits from buildings
            placed in service after December 31, 2007 from the tentative minimum tax
            limitation, and all HDC properties qualify. AMT may affect the investor's
            overall tax position and other credits they hold. Investor-specific review
            by their tax counsel is recommended.
          </p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          IMPL-152: Lifetime Coverage Mode Display
      ═══════════════════════════════════════════════════════════════════════ */}
      {sizingMode === 'lifetime' && isNonpassive && (
        <div className="mt-2">
          {/* Income Range Inputs */}
          <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-[#f0f7f7] rounded-md">
            <div>
              <label className="block text-xs text-[#474a44]/60 mb-1">Low-income year estimate</label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[#474a44]/40">$</span>
                <input
                  type="number"
                  value={lowIncome}
                  onChange={(e) => setLowIncome(e.target.value)}
                  onBlur={handleLifetimeCoverageRun}
                  className="w-full pl-5 pr-2 py-1.5 text-sm border border-gray-200 rounded focus:border-[#407f7f] focus:outline-none"
                  placeholder="200000"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-[#474a44]/60 mb-1">High-income year estimate</label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[#474a44]/40">$</span>
                <input
                  type="number"
                  value={highIncome}
                  onChange={(e) => setHighIncome(e.target.value)}
                  onBlur={handleLifetimeCoverageRun}
                  className="w-full pl-5 pr-2 py-1.5 text-sm border border-gray-200 rounded focus:border-[#407f7f] focus:outline-none"
                  placeholder="800000"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-[#474a44]/60 mb-1">Income distribution</label>
              <select
                value={incomeDist}
                onChange={(e) => { setIncomeDist(e.target.value as any); setTimeout(handleLifetimeCoverageRun, 0); }}
                className="w-full py-1.5 px-2 text-sm border border-gray-200 rounded focus:border-[#407f7f] focus:outline-none"
              >
                <option value="conservative">Conservative (75% low)</option>
                <option value="moderate">Moderate (50/50)</option>
                <option value="optimistic">Optimistic (75% high)</option>
              </select>
            </div>
          </div>

          {/* Lifetime Coverage Results */}
          {lifetimeCoverageResult && lifetimeCoverageResult.scenarios.length > 0 && (
            <>
              {/* Optimal Commitment */}
              <div className="mb-4 p-3 bg-white border border-[#7fbd45] rounded-md">
                <div className="text-xs text-[#474a44]/60 mb-1">Optimal Commitment (Lifetime Coverage)</div>
                <div className="text-xl font-bold text-[#7fbd45]">
                  {formatCompactCurrency(lifetimeCoverageResult.optimalCommitment)}
                </div>
                <div className="text-xs text-[#474a44]/50 mt-1">
                  Carryforward covers {lifetimeCoverageResult.coverageMetric > 20 ? '>20' : `~${lifetimeCoverageResult.coverageMetric.toFixed(1)}`} peak-income years of tax liability
                </div>
              </div>

              {/* Savings Account Balance Chart */}
              {lifetimeCoverageResult.moderateCarryforward.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-semibold text-[#474a44]/70 mb-2">
                    Tax Benefits Savings Account Balance
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={lifetimeCoverageResult.moderateCarryforward} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="year"
                        tick={{ fontSize: 10, fill: '#474a44' }}
                        label={{ value: 'Year', position: 'insideBottom', offset: -2, fontSize: 10 }}
                      />
                      <YAxis
                        tickFormatter={(v) => formatCompactCurrency(v)}
                        tick={{ fontSize: 10, fill: '#474a44' }}
                      />
                      <Tooltip
                        formatter={(value: any) => [formatCompactCurrency(Number(value) || 0), 'Balance']}
                        labelFormatter={(label: any) => `Year ${label}`}
                      />
                      <Bar dataKey="totalSavingsAccountBalance" fill="#407f7f" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Scenario Comparison Table */}
              <div className="mb-2">
                <div className="text-xs font-semibold text-[#474a44]/70 mb-2">Scenario Comparison</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#f0f7f7]">
                        <th className="text-left p-2 border-b border-gray-200" />
                        {lifetimeCoverageResult.scenarios.map(s => (
                          <th key={s.label} className="text-right p-2 border-b border-gray-200">{s.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="p-2 text-[#474a44]/70">Total benefit captured</td>
                        {lifetimeCoverageResult.scenarios.map(s => (
                          <td key={s.label} className="p-2 text-right font-medium text-[#7fbd45]">{formatCompactCurrency(s.totalBenefitCaptured)}</td>
                        ))}
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="p-2 text-[#474a44]/70">Carryforward peak balance</td>
                        {lifetimeCoverageResult.scenarios.map(s => (
                          <td key={s.label} className="p-2 text-right font-medium">{formatCompactCurrency(s.carryforwardPeakBalance)}</td>
                        ))}
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="p-2 text-[#474a44]/70">Coverage metric</td>
                        {lifetimeCoverageResult.scenarios.map(s => (
                          <td key={s.label} className="p-2 text-right font-medium">{s.coverageYears > 20 ? '>20' : s.coverageYears.toFixed(1)} yrs</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SizingOptimizerPanel;
