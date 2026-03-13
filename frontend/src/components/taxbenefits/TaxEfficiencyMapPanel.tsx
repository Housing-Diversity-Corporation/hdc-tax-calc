/**
 * Tax Efficiency Map Panel (IMPL-123, Layer 2)
 *
 * Heatmap visualization of tax efficiency across income × investment × investor type.
 * Contains zero calculation logic — all values come from useTaxEfficiencyMap hook.
 */

import React, { useState, useMemo } from 'react';
import type { TaxEfficiencyMapResult, CellResult, InvestorType } from '../../hooks/taxbenefits/useTaxEfficiencyMap';
import { INCOME_LEVELS, INVESTMENT_LEVELS } from '../../hooks/taxbenefits/useTaxEfficiencyMap';

// =============================================================================
// Types
// =============================================================================

type MetricView = 'moic' | 'utilization' | 'savingsPerDollar';

interface TaxEfficiencyMapPanelProps {
  result: TaxEfficiencyMapResult;
  fundEquity: number;
  onCeilingChange?: (ceiling: number) => void;
}

// =============================================================================
// Formatting Helpers
// =============================================================================

function formatCompactIncome(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  return `$${(value / 1_000).toFixed(0)}K`;
}

function formatCompactInvestment(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  return `$${(value / 1_000).toFixed(0)}K`;
}

function formatMetricValue(value: number, metric: MetricView): string {
  switch (metric) {
    case 'moic': return `${value.toFixed(2)}x`;
    case 'utilization': return `${(value * 100).toFixed(0)}%`;
    case 'savingsPerDollar': return `$${value.toFixed(2)}`;
  }
}

function getMetricValue(cell: CellResult, metric: MetricView): number {
  switch (metric) {
    case 'moic': return cell.moic;
    case 'utilization': return cell.utilizationRate;
    case 'savingsPerDollar': return cell.taxSavingsPerDollar;
  }
}

// =============================================================================
// Color Scales
// =============================================================================

function getCellColor(value: number, metric: MetricView, dimmed: boolean): string {
  if (dimmed) return 'bg-gray-100 text-gray-400';

  let intensity: number;
  switch (metric) {
    case 'moic':
      intensity = Math.min(1, Math.max(0, value / 3.0)); // 0x–3x scale
      break;
    case 'utilization':
      intensity = Math.min(1, Math.max(0, value)); // 0–100%
      break;
    case 'savingsPerDollar':
      intensity = Math.min(1, Math.max(0, value / 2.5)); // $0–$2.50 scale
      break;
  }

  if (value === 0) return 'bg-gray-50 text-gray-400';

  // Green gradient: light → deep
  if (intensity > 0.8) return 'bg-emerald-600 text-white';
  if (intensity > 0.6) return 'bg-emerald-500 text-white';
  if (intensity > 0.4) return 'bg-emerald-400 text-white';
  if (intensity > 0.2) return 'bg-emerald-200 text-emerald-900';
  return 'bg-emerald-100 text-emerald-800';
}

// =============================================================================
// Sub-Components
// =============================================================================

const INVESTOR_TYPE_LABELS: Record<InvestorType, string> = {
  rep_grouped: 'REP + Grouped',
  non_rep_passive: 'Non-REP Passive',
  w2_only: 'W-2 Only',
};

const METRIC_LABELS: Record<MetricView, string> = {
  moic: 'MOIC',
  utilization: 'Utilization %',
  savingsPerDollar: 'Tax Savings / $',
};

interface CellDetailProps {
  cell: CellResult | null;
}

const CellDetail: React.FC<CellDetailProps> = ({ cell }) => {
  if (!cell) {
    return (
      <div className="text-xs text-gray-400 italic p-3">
        Click a cell to see details
      </div>
    );
  }

  const savingsM = cell.totalTaxSavings / 1_000_000;

  return (
    <div className="p-3 space-y-1 text-xs">
      <div className="font-semibold text-[#474a44] text-sm mb-2">
        {formatCompactIncome(cell.income)} income / {formatCompactInvestment(cell.investment)} investment
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span className="text-gray-500">Total Tax Savings</span>
        <span className="font-medium text-[#474a44]">${savingsM.toFixed(3)}M</span>
        <span className="text-gray-500">Utilization Rate</span>
        <span className="font-medium text-[#474a44]">{(cell.utilizationRate * 100).toFixed(1)}%</span>
        <span className="text-gray-500">Savings per Dollar</span>
        <span className="font-medium text-[#474a44]">${cell.taxSavingsPerDollar.toFixed(3)}</span>
        <span className="text-gray-500">MOIC</span>
        <span className="font-medium text-[#474a44]">{cell.moic.toFixed(3)}x</span>
        <span className="text-gray-500">Binding Constraint</span>
        <span className="font-medium text-[#474a44]">{cell.bindingConstraint}</span>
      </div>
      {cell.isOptimal && (
        <div className="mt-2 px-2 py-1 bg-amber-50 border border-amber-200 rounded text-amber-700 text-xs font-medium">
          Peak efficiency investment for this income level
        </div>
      )}
      {!cell.isBelowFundCeiling && (
        <div className="mt-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-gray-500 text-xs">
          Above fund concentration limit
        </div>
      )}
    </div>
  );
};

// =============================================================================
// Main Component
// =============================================================================

const TaxEfficiencyMapPanel: React.FC<TaxEfficiencyMapPanelProps> = ({
  result,
  fundEquity,
}) => {
  const [activeType, setActiveType] = useState<InvestorType>('rep_grouped');
  const [activeMetric, setActiveMetric] = useState<MetricView>('savingsPerDollar');
  const [selectedCell, setSelectedCell] = useState<CellResult | null>(null);
  const [fundCeilingPct, setFundCeilingPct] = useState(20); // %

  const effectiveCeiling = fundEquity * (fundCeilingPct / 100);

  // Build grid: rows = income, cols = investment
  const grid = useMemo(() => {
    const typeCells = result.byType[activeType];
    const rows: CellResult[][] = [];
    for (const income of INCOME_LEVELS) {
      const row = INVESTMENT_LEVELS.map(investment => {
        const cell = typeCells.find(c => c.income === income && c.investment === investment);
        return cell!;
      });
      rows.push(row);
    }
    return rows;
  }, [result, activeType]);

  return (
    <div className="mb-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-[#474a44]">Tax Efficiency Map</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Tax benefit efficiency across income and investment levels
        </p>
      </div>

      {/* Controls */}
      <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap gap-4 items-center">
        {/* Investor Type Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Investor:</span>
          <div className="inline-flex rounded-md border border-gray-200 bg-gray-50 p-0.5">
            {INVESTOR_TYPES.map(type => (
              <button
                key={type}
                onClick={() => { setActiveType(type); setSelectedCell(null); }}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${
                  activeType === type
                    ? 'bg-white text-[#407f7f] font-semibold shadow-sm border border-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {INVESTOR_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        {/* Metric Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">Metric:</span>
          <div className="inline-flex rounded-md border border-gray-200 bg-gray-50 p-0.5">
            {(['savingsPerDollar', 'utilization', 'moic'] as MetricView[]).map(metric => (
              <button
                key={metric}
                onClick={() => setActiveMetric(metric)}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${
                  activeMetric === metric
                    ? 'bg-white text-[#407f7f] font-semibold shadow-sm border border-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {METRIC_LABELS[metric]}
              </button>
            ))}
          </div>
        </div>

        {/* Fund Size Slider */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-gray-500">Max per investor:</span>
          <input
            type="range"
            min={5}
            max={100}
            step={5}
            value={fundCeilingPct}
            onChange={(e) => setFundCeilingPct(Number(e.target.value))}
            className="w-24 h-1.5 accent-[#407f7f]"
          />
          <span className="text-xs font-medium text-[#474a44] w-12 text-right">
            {fundCeilingPct}%
          </span>
          <span className="text-xs text-gray-400">
            ({formatCompactInvestment(effectiveCeiling)})
          </span>
        </div>
      </div>

      {/* Heatmap + Detail */}
      <div className="flex">
        {/* Heatmap Table */}
        <div className="flex-1 overflow-x-auto p-3">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="text-left text-gray-500 font-medium px-1.5 py-1 w-16">
                  Income
                </th>
                {INVESTMENT_LEVELS.map(inv => (
                  <th key={inv} className="text-center text-gray-500 font-medium px-0.5 py-1 w-16">
                    {formatCompactInvestment(inv)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.map((row, rowIdx) => (
                <tr key={INCOME_LEVELS[rowIdx]}>
                  <td className="text-left font-medium text-[#474a44] px-1.5 py-0.5 whitespace-nowrap">
                    {formatCompactIncome(INCOME_LEVELS[rowIdx])}
                  </td>
                  {row.map((cell) => {
                    const value = getMetricValue(cell, activeMetric);
                    const dimmed = cell.investment > effectiveCeiling;
                    const isSelected = selectedCell === cell;
                    return (
                      <td
                        key={`${cell.income}-${cell.investment}`}
                        onClick={() => setSelectedCell(cell)}
                        className={`text-center px-0.5 py-0.5 cursor-pointer transition-all ${
                          getCellColor(value, activeMetric, dimmed)
                        } ${isSelected ? 'ring-2 ring-[#407f7f] ring-inset' : ''}`}
                      >
                        <div className="relative min-w-[56px]">
                          {cell.isOptimal && !dimmed && (
                            <span className="absolute -top-0.5 -right-0.5 text-amber-500 text-[8px] leading-none font-bold">
                              OPT
                            </span>
                          )}
                          {formatMetricValue(value, activeMetric)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        <div className="w-64 border-l border-gray-200 flex-shrink-0">
          <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
            <span className="text-xs font-medium text-gray-500">Cell Detail</span>
          </div>
          <CellDetail cell={selectedCell} />
        </div>
      </div>
    </div>
  );
};

const INVESTOR_TYPES: InvestorType[] = ['rep_grouped', 'non_rep_passive', 'w2_only'];

export default TaxEfficiencyMapPanel;
