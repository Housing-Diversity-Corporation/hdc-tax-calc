import React, { useState } from 'react';
import '../../../styles/taxbenefits/hdcCalculator.css';
import CollapsibleSection from './CollapsibleSection';
import type { TaxUtilizationResult, AnnualUtilization } from '../../../utils/taxbenefits/investorTaxUtilization';

/**
 * Phase A2 + IMPL-149: Tax Utilization Section
 *
 * Displays detailed tax utilization analysis when income composition is provided.
 * Conditionally replaces InvestmentRecoverySection when taxUtilization is computed.
 *
 * Display sections:
 * 1. Treatment Banner: treatmentLabel (e.g., "Non-REP — Passive Treatment")
 * 2. Summary Strip: totalDepreciationSavings, totalLIHTCUsed, overallUtilizationRate, fitIndicator
 * 3. Year-by-Year Table (collapsible, default collapsed): all 18 AnnualUtilization fields
 *    - Columns conditional on treatment: NOL for nonpassive, passive columns for passive
 * 4. Recapture Coverage: recaptureCoverage array (exit tax, offsets, coverage ratio)
 * 5. NOL Drawdown (nonpassive only): nolDrawdownSchedule if entries exist
 */

interface TaxUtilizationSectionProps {
  taxUtilization: TaxUtilizationResult;
  totalInvestment: number;
  formatCurrency: (value: number) => string;
}

const TaxUtilizationSection: React.FC<TaxUtilizationSectionProps> = ({
  taxUtilization,
  totalInvestment,
  formatCurrency
}) => {
  const [showYearlyDetail, setShowYearlyDetail] = useState(false);

  // Helper to get fit indicator color
  const getFitColor = (indicator: 'green' | 'yellow' | 'red') => {
    switch (indicator) {
      case 'green': return '#22c55e'; // Tailwind green-500
      case 'yellow': return '#eab308'; // Tailwind yellow-500
      case 'red': return '#ef4444'; // Tailwind red-500
      default: return '#6b7280'; // Tailwind gray-500
    }
  };

  // Helper to format percentage
  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

  // IMPL-149: Determine track for conditional column rendering
  const isNonpassive = taxUtilization.treatment === 'nonpassive';

  // Table cell styles
  const thGroupStyle: React.CSSProperties = { padding: '0.25rem 0.5rem', fontSize: '0.65rem', fontWeight: 600, color: 'var(--hdc-faded-jade)', textTransform: 'uppercase', letterSpacing: '0.03em', borderBottom: '1px solid rgba(146, 195, 194, 0.2)' };
  const thStyle: React.CSSProperties = { padding: '0.4rem 0.5rem', borderBottom: '1px solid rgba(146, 195, 194, 0.3)', whiteSpace: 'nowrap' };
  const thStyleRight: React.CSSProperties = { ...thStyle, textAlign: 'right' };
  const tdStyle: React.CSSProperties = { padding: '0.35rem 0.5rem', whiteSpace: 'nowrap' };
  const tdStyleRight: React.CSSProperties = { ...tdStyle, textAlign: 'right' };

  return (
    <CollapsibleSection title="Tax Utilization Analysis">
      <div>
        {/* ═══════════════════════════════════════════════════════════════════════
            TREATMENT BANNER
        ═══════════════════════════════════════════════════════════════════════ */}
        <div style={{
          backgroundColor: taxUtilization.treatment === 'nonpassive' ? '#E8F5E9' : '#E3F2FD',
          border: `1px solid ${taxUtilization.treatment === 'nonpassive' ? '#4CAF50' : '#2196F3'}`,
          borderRadius: '0.375rem',
          padding: '0.75rem',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Tax Treatment
              </span>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#333', marginTop: '0.25rem' }}>
                {taxUtilization.treatmentLabel}
              </div>
            </div>
            {/* Fit Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: getFitColor(taxUtilization.fitIndicator)
                }}
                title={taxUtilization.fitExplanation}
              />
              <span style={{ fontSize: '0.8rem', color: '#666' }}>
                {taxUtilization.fitIndicator === 'green' ? 'Excellent Fit' :
                 taxUtilization.fitIndicator === 'yellow' ? 'Moderate Fit' : 'Limited Fit'}
              </span>
            </div>
          </div>
          {taxUtilization.fitExplanation && (
            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
              {taxUtilization.fitExplanation}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            SUMMARY METRICS
        ═══════════════════════════════════════════════════════════════════════ */}
        <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(146, 195, 194, 0.3)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--hdc-faded-jade)', marginBottom: '0.75rem' }}>
            Utilization Summary
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="hdc-result-row">
              <span className="hdc-result-label">Total Investment:</span>
              <span className="hdc-result-value">{formatCurrency(totalInvestment)}</span>
            </div>

            <div className="hdc-result-row">
              <span className="hdc-result-label">Overall Utilization:</span>
              <span className="hdc-result-value" style={{ fontWeight: 600, color: 'var(--hdc-brown-rust)' }}>
                {formatPercent(taxUtilization.overallUtilizationRate)}
              </span>
            </div>

            <div className="hdc-result-row">
              <span className="hdc-result-label">Depreciation Savings:</span>
              <span className="hdc-result-value hdc-value-positive">
                {formatCurrency(taxUtilization.totalDepreciationSavings)}
              </span>
            </div>

            <div className="hdc-result-row">
              <span className="hdc-result-label">LIHTC Used:</span>
              <span className="hdc-result-value hdc-value-positive">
                {formatCurrency(taxUtilization.totalLIHTCUsed)}
              </span>
            </div>

            <div className="hdc-result-row">
              <span className="hdc-result-label">Benefits Generated:</span>
              <span className="hdc-result-value">{formatCurrency(taxUtilization.totalBenefitGenerated)}</span>
            </div>

            <div className="hdc-result-row">
              <span className="hdc-result-label">Benefits Usable:</span>
              <span className="hdc-result-value" style={{ fontWeight: 600 }}>
                {formatCurrency(taxUtilization.totalBenefitUsable)}
              </span>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            YEAR-BY-YEAR TABLE (Collapsible) — IMPL-149: All 18 AnnualUtilization fields
        ═══════════════════════════════════════════════════════════════════════ */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--hdc-faded-jade)',
              marginBottom: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onClick={() => setShowYearlyDetail(!showYearlyDetail)}
          >
            <span>{showYearlyDetail ? '▼' : '▶'}</span>
            Year-by-Year Detail
          </div>

          {showYearlyDetail && (
            <div style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
              <table style={{ width: '100%', fontSize: '0.7rem', borderCollapse: 'collapse', minWidth: isNonpassive ? '1000px' : '1000px' }}>
                <thead>
                  {/* Column group headers */}
                  <tr style={{ backgroundColor: 'rgba(146, 195, 194, 0.15)' }}>
                    <th style={thGroupStyle} />
                    <th colSpan={4} style={{ ...thGroupStyle, textAlign: 'center', borderLeft: '1px solid rgba(146, 195, 194, 0.3)' }}>Depreciation</th>
                    <th colSpan={3} style={{ ...thGroupStyle, textAlign: 'center', borderLeft: '1px solid rgba(146, 195, 194, 0.3)' }}>LIHTC Credits</th>
                    {isNonpassive ? (
                      <th colSpan={4} style={{ ...thGroupStyle, textAlign: 'center', borderLeft: '1px solid rgba(146, 195, 194, 0.3)' }}>NOL Tracking</th>
                    ) : (
                      <th colSpan={4} style={{ ...thGroupStyle, textAlign: 'center', borderLeft: '1px solid rgba(146, 195, 194, 0.3)' }}>Passive Tracking</th>
                    )}
                    <th colSpan={3} style={{ ...thGroupStyle, textAlign: 'center', borderLeft: '1px solid rgba(146, 195, 194, 0.3)' }}>Summary</th>
                  </tr>
                  {/* Individual column headers */}
                  <tr style={{ backgroundColor: 'rgba(146, 195, 194, 0.08)', textAlign: 'left' }}>
                    <th style={thStyle}>Year</th>
                    {/* Depreciation */}
                    <th style={{ ...thStyleRight, borderLeft: '1px solid rgba(146, 195, 194, 0.3)' }}>Generated</th>
                    <th style={thStyleRight}>Allowed</th>
                    <th style={thStyleRight}>Suspended</th>
                    <th style={thStyleRight}>Tax Savings</th>
                    {/* LIHTC */}
                    <th style={{ ...thStyleRight, borderLeft: '1px solid rgba(146, 195, 194, 0.3)' }}>Generated</th>
                    <th style={thStyleRight}>Usable</th>
                    <th style={thStyleRight}>Carried</th>
                    {/* Track-specific */}
                    {isNonpassive ? (
                      <>
                        <th style={{ ...thStyleRight, borderLeft: '1px solid rgba(146, 195, 194, 0.3)' }}>NOL Gen</th>
                        <th style={thStyleRight}>NOL Used</th>
                        <th style={thStyleRight}>NOL Pool</th>
                        <th style={thStyleRight}>Credit Carryforward</th>
                      </>
                    ) : (
                      <>
                        <th style={{ ...thStyleRight, borderLeft: '1px solid rgba(146, 195, 194, 0.3)' }}>Passive Inc Offset</th>
                        <th style={thStyleRight}>Passive Tax Remaining</th>
                        <th style={thStyleRight}>Suspended Loss</th>
                        <th style={thStyleRight}>Suspended Credits</th>
                      </>
                    )}
                    {/* Summary */}
                    <th style={{ ...thStyleRight, borderLeft: '1px solid rgba(146, 195, 194, 0.3)' }}>Benefit Gen</th>
                    <th style={thStyleRight}>Benefit Used</th>
                    <th style={thStyleRight}>Util %</th>
                  </tr>
                </thead>
                <tbody>
                  {taxUtilization.annualUtilization.map((yr) => (
                    <tr key={yr.year} style={{ borderBottom: '1px solid rgba(146, 195, 194, 0.15)' }}>
                      <td style={tdStyle}>{yr.year}</td>
                      {/* Depreciation */}
                      <td style={{ ...tdStyleRight, borderLeft: '1px solid rgba(146, 195, 194, 0.15)' }}>{formatCurrency(yr.depreciationGenerated)}</td>
                      <td style={tdStyleRight}>{formatCurrency(yr.depreciationAllowed)}</td>
                      <td style={{ ...tdStyleRight, color: yr.depreciationSuspended > 0 ? '#ef4444' : undefined }}>{formatCurrency(yr.depreciationSuspended)}</td>
                      <td style={{ ...tdStyleRight, color: 'var(--hdc-cabbage-pont)' }}>{formatCurrency(yr.depreciationTaxSavings)}</td>
                      {/* LIHTC */}
                      <td style={{ ...tdStyleRight, borderLeft: '1px solid rgba(146, 195, 194, 0.15)' }}>{formatCurrency(yr.lihtcGenerated)}</td>
                      <td style={tdStyleRight}>{formatCurrency(yr.lihtcUsable)}</td>
                      <td style={{ ...tdStyleRight, color: yr.lihtcCarried > 0 ? '#eab308' : undefined }}>{formatCurrency(yr.lihtcCarried)}</td>
                      {/* Track-specific */}
                      {isNonpassive ? (
                        <>
                          <td style={{ ...tdStyleRight, borderLeft: '1px solid rgba(146, 195, 194, 0.15)' }}>{formatCurrency(yr.nolGenerated)}</td>
                          <td style={tdStyleRight}>{formatCurrency(yr.nolUsed)}</td>
                          <td style={{ ...tdStyleRight, fontWeight: yr.nolPool > 0 ? 500 : undefined }}>{formatCurrency(yr.nolPool)}</td>
                          <td style={{ ...tdStyleRight, color: yr.cumulativeCarriedCredits > 0 ? 'var(--hdc-faded-jade)' : undefined }}>{formatCurrency(yr.cumulativeCarriedCredits)}</td>
                        </>
                      ) : (
                        <>
                          <td style={{ ...tdStyleRight, borderLeft: '1px solid rgba(146, 195, 194, 0.15)' }}>{formatCurrency(yr.residualPassiveIncome)}</td>
                          <td style={{ ...tdStyleRight, color: yr.residualPassiveTax > 0 ? '#ef4444' : undefined }}>{formatCurrency(yr.residualPassiveTax)}</td>
                          <td style={{ ...tdStyleRight, color: yr.cumulativeSuspendedLoss > 0 ? '#ef4444' : undefined }}>{formatCurrency(yr.cumulativeSuspendedLoss)}</td>
                          <td style={{ ...tdStyleRight, color: yr.cumulativeSuspendedCredits > 0 ? '#eab308' : undefined }}>{formatCurrency(yr.cumulativeSuspendedCredits)}</td>
                        </>
                      )}
                      {/* Summary */}
                      <td style={{ ...tdStyleRight, borderLeft: '1px solid rgba(146, 195, 194, 0.15)' }}>{formatCurrency(yr.totalBenefitGenerated)}</td>
                      <td style={{ ...tdStyleRight, fontWeight: 500 }}>{formatCurrency(yr.totalBenefitUsable)}</td>
                      <td style={{ ...tdStyleRight, fontWeight: 500 }}>{formatPercent(yr.utilizationRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            RECAPTURE COVERAGE
        ═══════════════════════════════════════════════════════════════════════ */}
        {taxUtilization.recaptureCoverage && taxUtilization.recaptureCoverage.length > 0 && (
          <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(146, 195, 194, 0.3)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--hdc-faded-jade)', marginBottom: '0.75rem' }}>
              Exit Recapture Coverage
            </div>

            {taxUtilization.recaptureCoverage.map((coverage, idx) => (
              <div key={idx} style={{
                backgroundColor: 'rgba(146, 195, 194, 0.1)',
                border: '1px solid var(--hdc-faded-jade)',
                borderRadius: '0.375rem',
                padding: '0.75rem',
                marginBottom: idx < taxUtilization.recaptureCoverage.length - 1 ? '0.5rem' : 0
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Year {coverage.exitYear} Exit
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
                  <div className="hdc-result-row">
                    <span className="hdc-result-label">Total Exit Tax:</span>
                    <span className="hdc-result-value" style={{ color: '#ef4444' }}>
                      {formatCurrency(coverage.totalExitTax)}
                    </span>
                  </div>

                  <div className="hdc-result-row">
                    <span className="hdc-result-label">Available Offsets:</span>
                    <span className="hdc-result-value" style={{ color: 'var(--hdc-cabbage-pont)' }}>
                      {formatCurrency(coverage.totalAvailableOffset)}
                    </span>
                  </div>

                  <div className="hdc-result-row">
                    <span className="hdc-result-label">Net Exposure:</span>
                    <span className="hdc-result-value" style={{ fontWeight: 600 }}>
                      {formatCurrency(coverage.netExitExposure)}
                    </span>
                  </div>

                  <div className="hdc-result-row">
                    <span className="hdc-result-label">Coverage Ratio:</span>
                    <span className="hdc-result-value" style={{
                      fontWeight: 600,
                      color: coverage.coverageRatio >= 1 ? 'var(--hdc-cabbage-pont)' :
                             coverage.coverageRatio >= 0.5 ? '#eab308' : '#ef4444'
                    }}>
                      {formatPercent(coverage.coverageRatio)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            NOL DRAWDOWN (Nonpassive only)
        ═══════════════════════════════════════════════════════════════════════ */}
        {taxUtilization.treatment === 'nonpassive' &&
         taxUtilization.nolDrawdownSchedule &&
         taxUtilization.nolDrawdownSchedule.length > 0 && (
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--hdc-faded-jade)', marginBottom: '0.75rem' }}>
              NOL Drawdown Schedule
            </div>

            <div style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ color: '#666' }}>Years to exhaust NOL: </span>
              <span style={{ fontWeight: 600 }}>{taxUtilization.nolDrawdownYears}</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(146, 195, 194, 0.1)', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem', borderBottom: '1px solid rgba(146, 195, 194, 0.3)' }}>Year Post-Exit</th>
                    <th style={{ padding: '0.5rem', borderBottom: '1px solid rgba(146, 195, 194, 0.3)', textAlign: 'right' }}>NOL Used</th>
                    <th style={{ padding: '0.5rem', borderBottom: '1px solid rgba(146, 195, 194, 0.3)', textAlign: 'right' }}>NOL Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {taxUtilization.nolDrawdownSchedule.map((entry) => (
                    <tr key={entry.year} style={{ borderBottom: '1px solid rgba(146, 195, 194, 0.15)' }}>
                      <td style={{ padding: '0.5rem' }}>{entry.year}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>{formatCurrency(entry.nolUsed)}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>{formatCurrency(entry.nolRemaining)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
};

export default TaxUtilizationSection;
