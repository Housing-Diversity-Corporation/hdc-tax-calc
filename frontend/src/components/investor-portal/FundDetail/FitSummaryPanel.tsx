/**
 * FitSummaryPanel (IMPL-105)
 *
 * Displays investor archetype classification, fit score, summary text,
 * binding constraint, recommended commitment, and warnings.
 *
 * Renders on Deal Detail between EfficiencyCurveChart and TaxUtilizationSection.
 * Only visible when an investor profile is applied and fit result is available.
 */

import React, { useState } from 'react';
import type { InvestorFitResult, Archetype } from '../../../utils/taxbenefits/investorFit';

interface FitSummaryPanelProps {
  fitResult: InvestorFitResult;
  recommendedCommitment: number;
  currentCommitment?: number;
  holdPeriod: number;
  formatCurrency: (value: number) => string;
}

// =============================================================================
// Archetype Badge Colors
// =============================================================================

const BADGE_COLORS: Record<Archetype, { bg: string; text: string }> = {
  A: { bg: '#7fbd45', text: '#ffffff' },       // green
  B: { bg: '#407f7f', text: '#ffffff' },       // blue/teal
  C: { bg: '#2dd4bf', text: '#1a1a1a' },       // teal
  D: { bg: '#f59e0b', text: '#1a1a1a' },       // amber
  E: { bg: '#ef4444', text: '#ffffff' },       // red
};

const FIT_RATING_LABELS: Record<string, string> = {
  excellent: 'Excellent',
  very_good: 'Very Good',
  good: 'Good',
  moderate: 'Moderate',
  poor_annual: 'Poor for Annual',
};

// =============================================================================
// Summary Text Templates
// =============================================================================

function getSummaryText(
  archetype: Archetype,
  utilizationPct: number,
  holdPeriod: number
): string {
  const utilStr = `${Math.round(utilizationPct)}%`;

  switch (archetype) {
    case 'A':
      return `Your tax profile can utilize ${utilStr} of this deal's annual benefit stream. LIHTC credits offset your tax dollar-for-dollar. Depreciation offsets your ordinary income directly.`;
    case 'B':
      return `Your tax profile can utilize ${utilStr} of this deal's annual benefit stream. Some depreciation converts to NOL carryforward under §461(l), providing value in subsequent years.`;
    case 'C':
      return `Your passive income supports ${utilStr} annual utilization. Both depreciation and LIHTC credits offset tax on your passive income. Commitment sized to your passive income capacity.`;
    case 'D':
      return `Your passive income supports ${utilStr} annual utilization. Remaining benefits suspend and release at disposition in Year ${holdPeriod}, adding to your exit return.`;
    case 'E':
      return 'Your income composition means annual tax benefits would be suspended (not lost) during the hold period. All benefits release at disposition. See total return analysis below.';
  }
}

// =============================================================================
// Component
// =============================================================================

const FitSummaryPanel: React.FC<FitSummaryPanelProps> = ({
  fitResult,
  recommendedCommitment,
  currentCommitment,
  holdPeriod,
  formatCurrency,
}) => {
  const [collapsedMedium, setCollapsedMedium] = useState(true);
  const badge = BADGE_COLORS[fitResult.archetype];

  const highWarnings = fitResult.warnings.filter(w => w.severity === 'high');
  const mediumWarnings = fitResult.warnings.filter(w => w.severity === 'medium');
  const lowWarnings = fitResult.warnings.filter(w => w.severity === 'low');

  return (
    <div className="mb-6 border border-gray-200 rounded-lg p-5 bg-white">
      {/* Header: Badge + Label */}
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-sm font-semibold text-[#474a44]">Investor Fit Analysis</h3>
        <span
          className="px-3 py-1 text-xs rounded-full font-semibold"
          style={{ backgroundColor: badge.bg, color: badge.text }}
        >
          {FIT_RATING_LABELS[fitResult.fitRating] || fitResult.fitRating}
        </span>
        <span className="text-xs text-[#474a44]/70">{fitResult.archetypeLabel}</span>
      </div>

      {/* Summary Text */}
      <p className="text-sm text-[#474a44] leading-relaxed mb-4">
        {getSummaryText(fitResult.archetype, fitResult.annualUtilizationPct, holdPeriod)}
      </p>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <div className="text-xs text-[#474a44]/60 mb-1">Recommended Commitment</div>
          <div className="text-lg font-bold text-[#407f7f]">{formatCurrency(recommendedCommitment)}</div>
          {currentCommitment !== undefined && currentCommitment !== recommendedCommitment && (
            <div className="text-[10px] text-[#474a44]/50 mt-0.5">
              Current: {formatCurrency(currentCommitment)}
            </div>
          )}
        </div>
        <div>
          <div className="text-xs text-[#474a44]/60 mb-1">Fit Score</div>
          <div className="text-lg font-bold text-[#474a44]">{fitResult.fitScore}/100</div>
        </div>
        <div>
          <div className="text-xs text-[#474a44]/60 mb-1">Binding Constraint</div>
          <div className="text-xs font-medium text-[#474a44]">None at recommended commitment</div>
        </div>
      </div>

      {/* High severity warnings — always visible, not dismissible */}
      {highWarnings.map((w, i) => (
        <div key={`high-${i}`} className="mb-2 p-3 rounded-md bg-amber-50 border border-amber-200">
          <div className="flex items-start gap-2">
            <span className="text-amber-600 text-sm mt-0.5">!</span>
            <div>
              <p className="text-sm text-amber-800 font-medium">{w.message}</p>
              <p className="text-[10px] text-amber-600 mt-1">{w.statutoryRef}</p>
            </div>
          </div>
        </div>
      ))}

      {/* Medium severity warnings — collapsible */}
      {mediumWarnings.length > 0 && (
        <div className="mb-2">
          <button
            onClick={() => setCollapsedMedium(!collapsedMedium)}
            className="w-full text-left p-3 rounded-md bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800 font-medium">
                {mediumWarnings.length} advisory {mediumWarnings.length === 1 ? 'note' : 'notes'}
              </span>
              <span className="text-xs text-blue-600">{collapsedMedium ? 'Show' : 'Hide'}</span>
            </div>
          </button>
          {!collapsedMedium && mediumWarnings.map((w, i) => (
            <div key={`med-${i}`} className="mt-1 p-3 rounded-md bg-blue-50 border border-blue-100">
              <p className="text-sm text-blue-800">{w.message}</p>
              <p className="text-[10px] text-blue-600 mt-1">{w.statutoryRef}</p>
            </div>
          ))}
        </div>
      )}

      {/* Low severity warnings — inline text */}
      {lowWarnings.map((w, i) => (
        <p key={`low-${i}`} className="text-xs text-[#474a44]/60 mt-1">
          {w.message} <span className="text-[10px]">({w.statutoryRef})</span>
        </p>
      ))}
    </div>
  );
};

export default FitSummaryPanel;
