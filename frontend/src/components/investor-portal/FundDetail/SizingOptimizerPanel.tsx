/**
 * SizingOptimizerPanel (IMPL-106)
 *
 * Interactive commitment slider with utilization curve chart.
 * Renders on Deal Detail below FitSummaryPanel.
 * Only visible when investor profile is applied and sizing result is available.
 *
 * Uses recharts for the utilization curve visualization.
 */

import React, { useMemo } from 'react';
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
} from 'recharts';
import type { InvestorFitResult, Archetype } from '../../../utils/taxbenefits/investorFit';
import type { SizingResult, SizingPoint } from '../../../utils/taxbenefits/investorSizing';

interface SizingOptimizerPanelProps {
  sizingResult: SizingResult;
  fitResult: InvestorFitResult;
  currentCommitment: number;
  onCommitmentChange: (value: number) => void;
  minSlider: number;
  maxSlider: number;
  formatCurrency: (value: number) => string;
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
}) => {
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
      <div className="flex gap-4 mb-4 text-xs">
        <div>
          <span className="text-[#474a44]/60">Optimal: </span>
          <span className="font-semibold text-[#407f7f]">
            {formatCompactCurrency(sizingResult.optimalCommitment)}
          </span>
        </div>
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

      {/* Metrics at Current Commitment */}
      {currentPoint && (
        <div className="grid grid-cols-5 gap-3">
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
    </div>
  );
};

export default SizingOptimizerPanel;
