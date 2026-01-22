import React, { useState } from 'react';
import '../../../styles/taxbenefits/hdcCalculator.css';
import CollapsibleSection from './CollapsibleSection';
import type { CashFlowItem } from '../../../types/taxbenefits';

/**
 * IMPL-078: Merged Investment Recovery & Tax Planning Section
 *
 * Combines FreeInvestmentAnalysisSection and TaxPlanningCapacitySection into
 * a single coherent display using engine values as single source of truth.
 *
 * Replaces:
 * - FreeInvestmentAnalysisSection.tsx
 * - TaxPlanningCapacitySection.tsx
 */

interface InvestmentRecoverySectionProps {
  // From engine - single source of truth
  investorEquity: number;
  // ISS-023: totalInvestment is the MOIC basis (net for Y0 syndication, gross for Y1+)
  totalInvestment: number;
  year1TaxBenefit: number;
  total10YearBenefits: number;
  benefitMultiple: number;
  excessBenefits: number;

  // For recovery timeline calculation - uses all benefit sources
  investorCashFlows: CashFlowItem[];

  // Tax rates for capacity calculations
  totalCapitalGainsRate: number;
  effectiveTaxRateForDepreciation: number;
  depreciationRecaptureRate: number;

  // Formatter
  formatCurrency: (value: number) => string;
}

const InvestmentRecoverySection: React.FC<InvestmentRecoverySectionProps> = ({
  investorEquity,
  totalInvestment,
  year1TaxBenefit,
  total10YearBenefits,
  benefitMultiple,
  excessBenefits,
  investorCashFlows,
  totalCapitalGainsRate,
  effectiveTaxRateForDepreciation,
  depreciationRecaptureRate,
  formatCurrency
}) => {
  const [showTaxRates, setShowTaxRates] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────────
  // CALCULATIONS (all derived from engine values)
  // ─────────────────────────────────────────────────────────────────────────────

  // ISS-023: Use totalInvestment (MOIC basis) for recovery calculations
  // This is net equity for Y0 syndication, gross equity for Y1+ or no syndication

  // Year 1 Coverage percentage
  const year1Coverage = totalInvestment > 0
    ? (year1TaxBenefit / totalInvestment) * 100
    : 0;

  // Free Investment Status
  const freeInvestmentStatus =
    year1TaxBenefit >= totalInvestment ? 'YES' :
    year1TaxBenefit >= totalInvestment * 0.75 ? 'PARTIAL' : 'NO';

  // Time to Recovery - using ALL cumulative benefits from investorCashFlows
  // Includes: taxBenefit (depreciation) + federalLIHTCCredit + stateLIHTCCredit + syndicationProceeds
  // ISS-023: Uses totalInvestment (net equity when Y0 syndicated) instead of gross investorEquity
  const calculateTimeToRecovery = (): number | null => {
    if (!investorCashFlows || investorCashFlows.length === 0) return null;
    if (totalInvestment <= 0) return null;

    let cumulative = 0;

    for (let i = 0; i < Math.min(investorCashFlows.length, 10); i++) {
      const cf = investorCashFlows[i];
      const yearBenefits =
        (cf.taxBenefit || 0) +
        (cf.federalLIHTCCredit || 0) +
        (cf.stateLIHTCCredit || 0) +
        (cf.stateLIHTCSyndicationProceeds || 0);

      cumulative += yearBenefits;

      if (cumulative >= totalInvestment) {
        // Calculate fractional year for precise recovery time
        const previousCumulative = cumulative - yearBenefits;
        const neededThisYear = totalInvestment - previousCumulative;
        const fractionOfYear = yearBenefits > 0 ? neededThisYear / yearBenefits : 1;
        return i + fractionOfYear; // i is 0-indexed, so year 1 = index 0
      }
    }
    return 10; // Extended recovery (>10 years)
  };

  const timeToRecovery = calculateTimeToRecovery();

  // Planning capacities (only calculated if excessBenefits > 0)
  const showExcessCapacity = excessBenefits > 0;
  const exchange1031Capacity = showExcessCapacity && totalCapitalGainsRate > 0
    ? excessBenefits / (totalCapitalGainsRate / 100)
    : 0;
  const rothConversionCapacity = showExcessCapacity && effectiveTaxRateForDepreciation > 0
    ? excessBenefits / (effectiveTaxRateForDepreciation / 100)
    : 0;
  const depreciationOffsetCapacity = showExcessCapacity && depreciationRecaptureRate > 0
    ? excessBenefits / (depreciationRecaptureRate / 100)
    : 0;

  // ─────────────────────────────────────────────────────────────────────────────
  // STYLING HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'YES': return 'var(--hdc-brown-rust)';
      case 'PARTIAL': return 'var(--hdc-cabbage-pont)';
      default: return 'var(--hdc-strikemaster)';
    }
  };

  const getRecoveryColor = (years: number | null) => {
    if (years === null) return 'var(--hdc-strikemaster)';
    if (years <= 1) return 'var(--hdc-brown-rust)';
    if (years <= 3) return 'var(--hdc-cabbage-pont)';
    if (years <= 5) return 'var(--hdc-faded-jade)';
    return 'var(--hdc-strikemaster)';
  };

  const formatRecoveryTime = (years: number | null) => {
    if (years === null) return 'N/A';
    if (years >= 10) return '>10 years';
    if (years < 1) return `${Math.ceil(years * 12)} months`;
    return `${years.toFixed(1)} years`;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <CollapsibleSection title="Investment Recovery & Tax Planning">
      <div>
        {/* ═══════════════════════════════════════════════════════════════════════
            INVESTMENT SUMMARY
        ═══════════════════════════════════════════════════════════════════════ */}
        <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(146, 195, 194, 0.3)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--hdc-faded-jade)', marginBottom: '0.75rem' }}>
            Investment Summary
          </div>

          <div className="hdc-result-row">
            <span className="hdc-result-label">Total Investment (Net):</span>
            <span className="hdc-result-value">{formatCurrency(totalInvestment)}</span>
          </div>

          <div className="hdc-result-row">
            <span className="hdc-result-label">Total 10-Year Benefits:</span>
            <span className="hdc-result-value hdc-value-positive" style={{ fontWeight: 600 }}>
              {formatCurrency(total10YearBenefits)}
            </span>
          </div>

          <div className="hdc-result-row">
            <span className="hdc-result-label">Benefit Multiple:</span>
            <span className="hdc-result-value" style={{ fontWeight: 600, color: 'var(--hdc-brown-rust)' }}>
              {benefitMultiple.toFixed(2)}x
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            RECOVERY TIMELINE
        ═══════════════════════════════════════════════════════════════════════ */}
        <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(146, 195, 194, 0.3)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--hdc-faded-jade)', marginBottom: '0.75rem' }}>
            Recovery Timeline
          </div>

          <div className="hdc-result-row">
            <span className="hdc-result-label">Year 1 Tax Benefits:</span>
            <span className="hdc-result-value hdc-value-positive">
              {formatCurrency(year1TaxBenefit)}
            </span>
          </div>

          <div className="hdc-result-row">
            <span className="hdc-result-label">Year 1 Coverage:</span>
            <span className="hdc-result-value">
              {year1Coverage.toFixed(0)}%
            </span>
          </div>

          {/* Time to Recovery - highlighted box */}
          <div style={{
            backgroundColor: 'rgba(146, 195, 194, 0.1)',
            border: '1px solid var(--hdc-faded-jade)',
            borderRadius: '0.375rem',
            padding: '0.75rem',
            marginTop: '0.75rem',
            marginBottom: '0.75rem'
          }}>
            <div className="hdc-result-row">
              <span className="hdc-result-label" style={{ fontWeight: 600 }}>Time to Full Recovery:</span>
              <span className="hdc-result-value" style={{
                fontWeight: 700,
                fontSize: '1.1rem',
                color: getRecoveryColor(timeToRecovery)
              }}>
                {formatRecoveryTime(timeToRecovery)}
              </span>
            </div>
          </div>

          <div className="hdc-result-row">
            <span className="hdc-result-label">Free Investment Status:</span>
            <span className="hdc-result-value" style={{
              fontWeight: 600,
              color: getStatusColor(freeInvestmentStatus)
            }}>
              {freeInvestmentStatus}
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            EXCESS CAPACITY FOR TAX PLANNING (only shown if excessBenefits > 0)
        ═══════════════════════════════════════════════════════════════════════ */}
        {showExcessCapacity && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--hdc-faded-jade)', marginBottom: '0.75rem' }}>
              Excess Capacity for Tax Planning
            </div>

            <div className="hdc-result-row" style={{ marginBottom: '0.75rem' }}>
              <span className="hdc-result-label">Net Excess Benefits:</span>
              <span className="hdc-result-value hdc-value-positive" style={{ fontWeight: 600 }}>
                {formatCurrency(excessBenefits)}
              </span>
            </div>

            <div style={{
              fontSize: '0.75rem',
              color: 'var(--hdc-cabbage-pont)',
              marginBottom: '0.5rem',
              fontWeight: 500
            }}>
              Potential Uses:
            </div>

            <div style={{ paddingLeft: '0.75rem' }}>
              <div className="hdc-result-row">
                <span className="hdc-result-label">• 1031 Exchange Capacity:</span>
                <span className="hdc-result-value">{formatCurrency(exchange1031Capacity)}</span>
              </div>
              <div className="hdc-result-row">
                <span className="hdc-result-label">• Roth Conversion Capacity:</span>
                <span className="hdc-result-value">{formatCurrency(rothConversionCapacity)}</span>
              </div>
              <div className="hdc-result-row">
                <span className="hdc-result-label">• Depreciation Offset:</span>
                <span className="hdc-result-value">{formatCurrency(depreciationOffsetCapacity)}</span>
              </div>
            </div>

            {/* Collapsible Tax Rates Reference */}
            <div style={{ marginTop: '1rem' }}>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: 'var(--hdc-cabbage-pont)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
                onClick={() => setShowTaxRates(!showTaxRates)}
              >
                <span>{showTaxRates ? '▼' : '▶'}</span>
                <span>Tax Rates Reference</span>
              </div>

              {showTaxRates && (
                <div style={{
                  padding: '0.5rem 0.75rem',
                  marginTop: '0.5rem',
                  borderLeft: '2px solid var(--hdc-faded-jade)',
                  fontSize: '0.7rem'
                }}>
                  <div className="hdc-result-row">
                    <span className="hdc-result-label">Capital Gains Rate:</span>
                    <span className="hdc-result-value">{totalCapitalGainsRate.toFixed(1)}%</span>
                  </div>
                  <div className="hdc-result-row">
                    <span className="hdc-result-label">Ordinary Income Rate:</span>
                    <span className="hdc-result-value">{effectiveTaxRateForDepreciation.toFixed(1)}%</span>
                  </div>
                  <div className="hdc-result-row">
                    <span className="hdc-result-label">Depreciation Recapture:</span>
                    <span className="hdc-result-value">{depreciationRecaptureRate}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
};

export default InvestmentRecoverySection;
