/**
 * @deprecated IMPL-015: This component functionality has been absorbed into:
 * - InvestorProfileSection.tsx: REP/Non-REP track, income inputs
 * - ProjectionsSection.tsx: Depreciation settings
 * Keep for backward compatibility but do not use in new code.
 */
import React, { useState } from 'react';
import '../../../styles/taxbenefits/hdcCalculator.css';

interface TaxPlanningInputsSectionProps {
  // Core tax planning toggle
  includeDepreciationSchedule?: boolean;
  setIncludeDepreciationSchedule?: (value: boolean) => void;

  // Investor track (passed from InvestorTaxAndOZSection)
  investorTrack?: 'rep' | 'non-rep';

  // REP-specific inputs
  w2Income?: number;
  setW2Income?: (value: number) => void;
  businessIncome?: number;
  setBusinessIncome?: (value: number) => void;
  iraBalance?: number;
  setIraBalance?: (value: number) => void;

  // Non-REP specific inputs
  passiveIncome?: number;
  setPassiveIncome?: (value: number) => void;
  assetSaleGain?: number;
  setAssetSaleGain?: (value: number) => void;

  // Year 1 depreciation percentage
  yearOneDepreciationPct?: number;

  // Helper functions
  formatCurrency?: (value: number) => string;
  isReadOnly?: boolean;
}

const TaxPlanningInputsSection: React.FC<TaxPlanningInputsSectionProps> = ({
  includeDepreciationSchedule = false,
  setIncludeDepreciationSchedule,
  investorTrack = 'rep',
  w2Income = 0,
  setW2Income,
  businessIncome = 0,
  setBusinessIncome,
  iraBalance = 0,
  setIraBalance,
  passiveIncome = 0,
  setPassiveIncome,
  assetSaleGain = 0,
  setAssetSaleGain,
  yearOneDepreciationPct = 20,
  formatCurrency = (v) => `$${(v / 1000000).toFixed(1)}M`,
  isReadOnly = false
}) => {
  const [isExpanded, setIsExpanded] = useState(true); // Start expanded for visibility

  // Local currency formatter that doesn't assume millions
  const formatValue = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    } else {
      return `$${value.toFixed(0)}`;
    }
  };

  // Tax Planning Analysis is ALWAYS enabled - it's the core feature of HDC calculator

  return (
    <div className="hdc-section">
      <h3
        className="hdc-section-header"
        style={{ cursor: 'pointer', position: 'relative' }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span style={{ marginRight: '0.5rem' }}>
          {isExpanded ? '▼' : '▶'}
        </span>
        Tax Planning Analysis
      </h3>

      {isExpanded && (
        <div style={{ padding: '0 1rem 1rem 1rem' }}>
          {/* Tax Planning Analysis is ALWAYS ENABLED */}
          <div style={{
            marginBottom: '1rem',
            padding: '0.75rem',
            background: 'var(--hdc-pale-mint)',
            borderRadius: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem', color: 'var(--hdc-faded-jade)' }}>✓</span>
              <span style={{ fontWeight: 600, color: 'var(--hdc-faded-jade)' }}>
                Full Tax Planning Analysis Active
              </span>
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--hdc-slate-gray)',
              marginTop: '0.25rem',
              marginLeft: '1.5rem'
            }}>
              10-year depreciation schedule • Tax capacity modeling • IRA conversion planning
            </div>
          </div>

          {/* REP-specific inputs */}
          {investorTrack === 'rep' && (
            <div>
              <h4 style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--hdc-faded-jade)',
                marginBottom: '0.75rem'
              }}>
                REP Income Sources (for §461(l) tracking)
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="hdc-input-group">
                  <label className="hdc-input-label">Annual W-2 Income</label>
                  <input
                    type="number"
                    disabled={isReadOnly}
                    min="0"
                    step="100000"
                    value={w2Income}
                    onChange={(e) => setW2Income?.(Number(e.target.value))}
                    className="hdc-input"
                    placeholder="e.g., 2000000"
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--hdc-slate-gray)', marginTop: '0.25rem' }}>
                    Subject to $626K annual limit
                  </div>
                </div>

                <div className="hdc-input-group">
                  <label className="hdc-input-label">Business/Rental Income</label>
                  <input
                    type="number"
                    disabled={isReadOnly}
                    min="0"
                    step="100000"
                    value={businessIncome}
                    onChange={(e) => setBusinessIncome?.(Number(e.target.value))}
                    className="hdc-input"
                    placeholder="e.g., 500000"
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--hdc-slate-gray)', marginTop: '0.25rem' }}>
                    No §461(l) limitation
                  </div>
                </div>
              </div>

              <div className="hdc-input-group" style={{ marginTop: '0.75rem' }}>
                <label className="hdc-input-label">Traditional IRA Balance (for conversion planning)</label>
                <input
                  type="number"
                  disabled={isReadOnly}
                  min="0"
                  step="100000"
                  value={iraBalance}
                  onChange={(e) => setIraBalance?.(Number(e.target.value))}
                  className="hdc-input"
                  placeholder="e.g., 3000000"
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--hdc-slate-gray)', marginTop: '0.25rem' }}>
                  HDC losses can offset Roth conversion taxes
                </div>
              </div>

              {/* REP Summary */}
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                border: '1px solid var(--hdc-mercury)',
                borderLeft: '4px solid var(--hdc-faded-jade)',
                borderRadius: '4px'
              }}>
                <div style={{ fontWeight: 600, color: 'var(--hdc-faded-jade)', marginBottom: '0.5rem' }}>
                  REP Tax Planning Preview:
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--hdc-slate-gray)' }}>
                  • Year 1 W-2 offset capacity: {formatValue(Math.min(w2Income, 626000))}
                  <br />
                  • Business income offset: {formatValue(businessIncome)} (unlimited)
                  <br />
                  {iraBalance > 0 && (
                    <>• IRA conversion opportunity: {formatValue(Math.min(iraBalance, 626000 * 10))} over 10 years</>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Non-REP specific inputs */}
          {investorTrack === 'non-rep' && (
            <div>
              <h4 style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--hdc-faded-jade)',
                marginBottom: '0.75rem'
              }}>
                Passive Income Sources (UNLIMITED offset capacity)
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="hdc-input-group">
                  <label className="hdc-input-label">Annual Passive Income</label>
                  <input
                    type="number"
                    disabled={isReadOnly}
                    min="0"
                    step="100000"
                    value={passiveIncome}
                    onChange={(e) => setPassiveIncome?.(Number(e.target.value))}
                    className="hdc-input"
                    placeholder="e.g., 5000000"
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--hdc-cabbage-pont)', marginTop: '0.25rem' }}>
                    NO ANNUAL LIMIT ✓
                  </div>
                </div>

                <div className="hdc-input-group">
                  <label className="hdc-input-label">Capital Gains to Offset</label>
                  <input
                    type="number"
                    disabled={isReadOnly}
                    min="0"
                    step="1000000"
                    value={assetSaleGain}
                    onChange={(e) => setAssetSaleGain?.(Number(e.target.value))}
                    className="hdc-input"
                    placeholder="e.g., 10000000"
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--hdc-cabbage-pont)', marginTop: '0.25rem' }}>
                    Stocks, crypto, fund exits
                  </div>
                </div>
              </div>

              {/* Non-REP Summary */}
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: 'linear-gradient(135deg, #10b98115 0%, #06b6d415 100%)',
                border: '1px solid #10b981',
                borderRadius: '4px'
              }}>
                <div style={{ fontWeight: 600, color: '#047857', marginBottom: '0.5rem' }}>
                  Non-REP Tax Planning Preview
                </div>
                <div style={{ fontSize: '0.875rem', color: '#065f46' }}>
                  • Total passive income: {formatValue(passiveIncome)} (NO LIMIT)
                  <br />
                  • Capital gains to offset: {formatValue(assetSaleGain)}
                  <br />
                  • <strong>Key Advantage:</strong> Use ALL losses immediately, no waiting!
                </div>
              </div>
            </div>
          )}

          {/* What's Included */}
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: 'var(--hdc-mercury)',
            borderRadius: '8px',
            fontSize: '0.875rem'
          }}>
            <strong>REP Tax Planning Preview:</strong>
            <ul style={{
              margin: '0.5rem 0 0 1.5rem',
              padding: 0,
              listStyleType: 'disc',
              listStylePosition: 'outside'
            }}>
              <li style={{ marginBottom: '0.25rem' }}>10-year depreciation schedule with {yearOneDepreciationPct}% Year 1 bonus</li>
              <li style={{ marginBottom: '0.25rem' }}>{investorTrack === 'rep' ? 'NOL tracking and §461(l) limitation modeling' : 'Unlimited passive gain offset scenarios'}</li>
              <li style={{ marginBottom: '0.25rem' }}>{investorTrack === 'rep' ? 'IRA to Roth conversion optimization' : 'Capital gains tax elimination strategies'}</li>
              <li style={{ marginBottom: '0.25rem' }}>State conformity adjustments</li>
              <li style={{ marginBottom: '0.25rem' }}>Multi-year tax capacity projections</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxPlanningInputsSection;