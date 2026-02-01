import React, { useState } from 'react';
import '../../../styles/taxbenefits/hdcCalculator.css';
import { Slider } from '../../ui/slider';
import { Input } from '../../ui/input';

interface ProjectionsSectionProps {
  // Existing projections
  holdPeriod: number;
  setHoldPeriod: (value: number) => void;
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
  taxBenefitDelayMonths: number;
  setTaxBenefitDelayMonths: (value: number) => void;

  // Read-only mode
  isReadOnly?: boolean;
}

const ProjectionsSection: React.FC<ProjectionsSectionProps> = ({
  holdPeriod,
  setHoldPeriod,
  // ISS-068c: Single NOI growth rate
  noiGrowthRate,
  setNoiGrowthRate,
  exitCapRate,
  setExitCapRate,
  yearOneDepreciationPct,
  setYearOneDepreciationPct,
  constructionDelayMonths,
  setConstructionDelayMonths,
  taxBenefitDelayMonths,
  setTaxBenefitDelayMonths,
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
          6. Projections
        </h3>

        {isExpanded && (
          <>
            {/* Hold Period */}
            <div className="hdc-input-group">
              <label className="hdc-input-label">Hold Period (Years)</label>
              <Slider
                disabled={isReadOnly}
                min={10}
                max={30}
                step={1}
                value={[holdPeriod]}
                onValueChange={(vals) => setHoldPeriod(vals[0])}
              />
              <div style={{ fontSize: '0.7rem', color: 'var(--hdc-cabbage-pont)', marginTop: '0.25rem' }}>
                {holdPeriod} years (exit at year {holdPeriod})
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

              {/* Construction Delay */}
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
                  Delay before stabilized operations begin
                </div>
              </div>

              {/* Tax Benefit Delay */}
              <div className="hdc-input-group" style={{ marginTop: '0.75rem' }}>
                <label className="hdc-input-label">Tax Loss Realization Delay (months)</label>
                <Input
                  type="number"
                  min="0"
                  max="24"
                  step="1"
                  value={taxBenefitDelayMonths}
                  onChange={(e) => setTaxBenefitDelayMonths(Number(e.target.value) || 0)}
                  className="hdc-input"
                  disabled={isReadOnly}
                />
                <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.25rem' }}>
                  Months after investment before K-1 losses are claimable
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectionsSection;
