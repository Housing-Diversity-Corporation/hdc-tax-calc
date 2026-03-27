import React, { useState } from 'react';
import '../../../styles/taxbenefits/hdcCalculator.css';
import { Slider } from '../../ui/slider';
import { Input } from '../../ui/input';
import { ComputedTimeline } from '../../../types/taxbenefits';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatDate = (date: Date): string =>
  `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;

interface ProjectionsSectionProps {
  // Computed hold period (read-only)
  totalInvestmentYears: number;
  holdFromPIS: number;
  // exitMonth removed (IMPL-117) — now engine-internal, auto-derived from timeline
  // ISS-068c: Single NOI growth rate replaces revenueGrowth, expenseGrowth, opexRatio
  noiGrowthRate: number;
  setNoiGrowthRate: (value: number) => void;
  exitCapRate: number;
  setExitCapRate: (value: number) => void;

  // Added from BasicInputsSection
  yearOneDepreciationPct: number;
  setYearOneDepreciationPct: (value: number) => void;
  constructionDelayMonths: number;
  setConstructionDelayMonths: (value: number) => void;

  // Timing Architecture (IMPL-114)
  investmentDate?: string;
  setInvestmentDate?: (value: string) => void;
  exitExtensionMonths?: number;
  setExitExtensionMonths?: (value: number) => void;
  computedTimeline?: ComputedTimeline | null;

  // Read-only mode
  isReadOnly?: boolean;
}

const ProjectionsSection: React.FC<ProjectionsSectionProps> = ({
  totalInvestmentYears,
  holdFromPIS,
  // ISS-068c: Single NOI growth rate
  noiGrowthRate,
  setNoiGrowthRate,
  exitCapRate,
  setExitCapRate,
  yearOneDepreciationPct,
  setYearOneDepreciationPct,
  constructionDelayMonths,
  setConstructionDelayMonths,
  investmentDate = '',
  setInvestmentDate,
  exitExtensionMonths = 0,
  setExitExtensionMonths,
  computedTimeline = null,
  isReadOnly = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="hdc-calculator">
      <div className="hdc-section" style={{ borderLeft: '4px solid var(--hdc-cabbage-pont)' }}>
        <h3
          className="hdc-section-header"
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            marginBottom: '0.625rem',
            paddingBottom: '0.375rem',
            borderBottom: '2px solid var(--hdc-cabbage-pont)',
          }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span style={{ marginRight: '0.5rem' }}>{isExpanded ? '▼' : '▶'}</span>
          3. Projections
        </h3>

        {isExpanded && (
          <>
            {/* Hold Period (Computed) — IMPL-087: includes disposition year */}
            <div className="hdc-input-group">
              <label className="hdc-input-label">Hold Period (Computed)</label>
              <div style={{ padding: '0.5rem', background: '#f0f7f7', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                  {computedTimeline
                    ? `${computedTimeline.totalHoldMonths} months (${(computedTimeline.totalHoldMonths / 12).toFixed(1)} years)`
                    : `${totalInvestmentYears} years total investment (includes disposition year)`
                  }
                </div>
                <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.25rem' }}>
                  {computedTimeline
                    ? `${computedTimeline.holdFromPIS} yr credit period, exit ${formatDate(computedTimeline.actualExitDate)}${computedTimeline.isExtended ? ` (+${exitExtensionMonths}mo extended)` : ''}`
                    : `${holdFromPIS} years from PIS + 1 year for exit`
                  }
                </div>
              </div>
            </div>

            {/* ISS-068c: Single NOI Growth Rate */}
            <div className="hdc-input-group">
              <label className="hdc-input-label">NOI Growth (%)</label>
              <Slider
                disabled={isReadOnly}
                min={0}
                max={8}
                step={0.5}
                value={[noiGrowthRate]}
                onValueChange={(vals) => setNoiGrowthRate(vals[0])}
              />
              <div style={{ fontSize: '0.7rem', color: 'var(--hdc-cabbage-pont)', marginTop: '0.25rem' }}>
                {noiGrowthRate}% annual NOI growth
              </div>
            </div>

            {/* Exit Cap Rate */}
            <div className="hdc-input-group">
              <label className="hdc-input-label">Exit Cap Rate (%)</label>
              <Slider
                disabled={isReadOnly}
                min={4}
                max={10}
                step={0.5}
                value={[exitCapRate]}
                onValueChange={(vals) => setExitCapRate(vals[0])}
              />
              <div style={{ fontSize: '0.7rem', color: 'var(--hdc-cabbage-pont)', marginTop: '0.25rem' }}>
                {exitCapRate}% (for exit valuation)
              </div>
            </div>

            {/* Depreciation & Timing Section */}
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--hdc-mercury)', paddingTop: '1rem' }}>
              <h4 style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--hdc-faded-jade)',
                marginBottom: '0.75rem',
              }}>
                Depreciation & Timing
              </h4>

              {/* Year 1 Bonus Depreciation */}
              <div className="hdc-input-group">
                <label className="hdc-input-label">Year 1 Bonus Depreciation (%)</label>
                <Slider
                  disabled={isReadOnly}
                  min={0}
                  max={100}
                  step={20}
                  value={[yearOneDepreciationPct]}
                  onValueChange={(vals) => setYearOneDepreciationPct(vals[0])}
                />
                <div style={{ fontSize: '0.7rem', color: 'var(--hdc-cabbage-pont)', marginTop: '0.25rem' }}>
                  {yearOneDepreciationPct}% of depreciable basis taken in Year 1
                </div>
                <div style={{ fontSize: '0.65rem', color: '#666', marginTop: '0.25rem' }}>
                  Current bonus depreciation phase-out: 60% (2024), 40% (2025), 20% (2026), 0% (2027+)
                </div>
              </div>

              {/* IMPL-114: Investment Date Picker */}
              <div className="hdc-input-group" style={{ marginTop: '0.75rem' }}>
                <label className="hdc-input-label">Investment Date</label>
                <input
                  type="date"
                  value={investmentDate}
                  onChange={(e) => setInvestmentDate?.(e.target.value)}
                  className="hdc-input"
                  disabled={isReadOnly}
                  style={{ padding: '0.375rem', fontSize: '0.875rem', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.25rem' }}>
                  {investmentDate
                    ? 'Date-driven timing active — K-1 dates, XIRR, and exit auto-computed'
                    : 'Set to enable date-precise timing (XIRR, K-1 realization dates, exit planning)'
                  }
                </div>
              </div>

              {/* Construction/Development Period */}
              <div className="hdc-input-group" style={{ marginTop: '0.75rem' }}>
                <label className="hdc-input-label">Construction/Development Period (months)</label>
                <Input
                  type="number"
                  min="0"
                  max="48"
                  step="1"
                  value={constructionDelayMonths}
                  onChange={(e) => setConstructionDelayMonths(Number(e.target.value) || 0)}
                  className="hdc-input"
                  disabled={isReadOnly}
                />
                <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.25rem' }}>
                  Months for permitting, entitlement, construction, and lease-up before placed in service
                </div>
              </div>

              {/* exitMonth dropdown removed (IMPL-117) — now engine-internal, auto-derived from timeline */}

              {/* IMPL-114: Exit Extension Slider — visible when computedTimeline exists */}
              {computedTimeline && (
                <div className="hdc-input-group" style={{ marginTop: '0.75rem' }}>
                  <label className="hdc-input-label">Extend Hold</label>
                  <Slider
                    disabled={isReadOnly}
                    min={0}
                    max={240}
                    step={1}
                    value={[exitExtensionMonths]}
                    onValueChange={(vals) => setExitExtensionMonths?.(vals[0])}
                  />
                  <div style={{ fontSize: '0.7rem', color: 'var(--hdc-cabbage-pont)', marginTop: '0.25rem' }}>
                    {exitExtensionMonths === 0
                      ? 'Optimal exit (no extension)'
                      : exitExtensionMonths >= 12
                        ? `+${(exitExtensionMonths / 12).toFixed(1)} yr beyond optimal exit`
                        : `+${exitExtensionMonths} mo beyond optimal exit`
                    }
                  </div>
                </div>
              )}

              {/* IMPL-114: Computed Dates Display — when investmentDate is set */}
              {computedTimeline && (
                <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: '#f0f7f7', borderRadius: '4px', fontSize: '0.75rem', color: '#474a44' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Computed Timeline</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.15rem 0.75rem' }}>
                    <span style={{ color: '#888' }}>PIS Date:</span>
                    <span style={{ fontWeight: 600, color: 'var(--hdc-cabbage-pont)' }}>
                      {formatDate(computedTimeline.pisDate)}
                      {computedTimeline.pisIsOverridden && (
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.6rem', padding: '1px 5px', borderRadius: 3, background: '#FDF2F2', border: '1px solid #E74C3C', color: '#922B21', fontWeight: 700, textTransform: 'uppercase' as const }}>overridden</span>
                      )}
                    </span>
                    <span style={{ color: '#888' }}>Bonus Dep K-1:</span>
                    <span>{formatDate(computedTimeline.bonusDepK1Date)} ({computedTimeline.bonusDepLagMonths} mo from PIS)</span>
                    <span style={{ color: '#888' }}>First LIHTC K-1:</span>
                    <span>{formatDate(computedTimeline.firstLihtcK1Date)}</span>
                    <span style={{ color: '#888' }}>Optimal Exit:</span>
                    <span>{formatDate(computedTimeline.actualExitDate)} ({(computedTimeline.totalHoldMonths / 12).toFixed(1)} yr total hold)</span>
                    {computedTimeline.ozFloorBinding && (
                      <>
                        <span style={{ color: '#888' }}>OZ Floor:</span>
                        <span style={{ color: 'var(--hdc-brown-rust)', fontWeight: 600 }}>
                          OZ 10-year minimum is binding ({computedTimeline.ozMinimumDate ? formatDate(computedTimeline.ozMinimumDate) : ''})
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Construction Timing Summary — only on old path */}
              {!computedTimeline && constructionDelayMonths > 0 && (
                <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: '#f0f7f7', borderRadius: '4px', fontSize: '0.7rem', color: '#474a44' }}>
                  <div><strong>Construction Project</strong></div>
                  <div>Placed in service: Year {Math.floor(constructionDelayMonths / 12) + 1}</div>
                  <div>Total investment duration: {totalInvestmentYears} years</div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectionsSection;
