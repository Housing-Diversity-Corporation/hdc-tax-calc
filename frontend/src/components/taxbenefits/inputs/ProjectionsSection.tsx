import React, { useState } from 'react';
import '../../../styles/taxbenefits/hdcCalculator.css';
import { Slider } from '../../ui/slider';
import { Input } from '../../ui/input';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface ProjectionsSectionProps {
  // Computed hold period (read-only)
  totalInvestmentYears: number;
  holdFromPIS: number;
  // IMPL-087: Exit month
  exitMonth: number;
  setExitMonth: (value: number) => void;
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
  totalInvestmentYears,
  holdFromPIS,
  exitMonth,
  setExitMonth,
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
          3. Projections
        </h3>

        {isExpanded && (
          <>
            {/* Hold Period (Computed) — IMPL-087: includes disposition year */}
            <div className="hdc-input-group">
              <label className="hdc-input-label">Hold Period (Computed)</label>
              <div style={{ padding: '0.5rem', background: '#f0f7f7', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                  {totalInvestmentYears} years total investment (includes disposition year)
                </div>
                <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.25rem' }}>
                  {holdFromPIS} years from PIS + 1 year for exit in {MONTH_NAMES[exitMonth - 1]}
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

              {/* Tax Benefit Delay */}
              <div className="hdc-input-group" style={{ marginTop: '0.75rem' }}>
                <label className="hdc-input-label">Tax Benefit Realization Delay (months)</label>
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
                  Months after tax year end before K-1 delivery. Shifts benefit timing for IRR. Typical: 3-9 months.
                </div>
              </div>

              {/* IMPL-087: Exit Month */}
              <div className="hdc-input-group" style={{ marginTop: '0.75rem' }}>
                <label className="hdc-input-label">Exit Month</label>
                <select
                  value={exitMonth}
                  onChange={(e) => setExitMonth(Number(e.target.value))}
                  className="hdc-input"
                  disabled={isReadOnly}
                  style={{ padding: '0.375rem', fontSize: '0.875rem', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  {MONTH_NAMES.map((name, i) => (
                    <option key={i + 1} value={i + 1}>{name} ({i + 1})</option>
                  ))}
                </select>
                <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.25rem' }}>
                  Month of property disposition/exit. Prorates final year NOI, debt service, and fees.
                </div>
              </div>

              {/* Construction Timing Summary */}
              {constructionDelayMonths > 0 && (
                <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: '#f0f7f7', borderRadius: '4px', fontSize: '0.7rem', color: '#474a44' }}>
                  <div><strong>Construction Project</strong></div>
                  <div>Placed in service: Year {Math.floor(constructionDelayMonths / 12) + 1}</div>
                  <div>Tax benefits begin: Year {(() => {
                    const pisYear = Math.floor(constructionDelayMonths / 12) + 1;
                    const dly = Math.floor(taxBenefitDelayMonths / 12);
                    const frac = (taxBenefitDelayMonths % 12) / 12;
                    const startYear = pisYear + dly;
                    if (taxBenefitDelayMonths === 0 || frac === 0) return `${startYear}`;
                    return `${startYear} (${Math.round((1 - frac) * 100)}% Year ${startYear}, ${Math.round(frac * 100)}% Year ${startYear + 1})`;
                  })()}</div>
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
