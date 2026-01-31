import React from 'react';
import '../../../styles/taxbenefits/hdcCalculator.css';
import CollapsibleSection from './CollapsibleSection';
import type { CashFlowItem } from '../../../types/taxbenefits';

/**
 * IMPL-078: Investment Recovery Section
 *
 * Displays investment summary, recovery timeline, and benefit metrics.
 * Uses engine values as single source of truth.
 *
 * ISS-065: Removed "Excess Capacity for Tax Planning" section and
 * "Free Investment Status" indicator per product direction.
 */

interface InvestmentRecoverySectionProps {
  // ISS-023: totalInvestment is the MOIC basis (net for Y0 syndication, gross for Y1+)
  totalInvestment: number;
  year1TaxBenefit: number;
  total10YearBenefits: number;
  benefitMultiple: number;

  // For recovery timeline calculation - uses all benefit sources
  investorCashFlows: CashFlowItem[];

  // Formatter
  formatCurrency: (value: number) => string;
}

const InvestmentRecoverySection: React.FC<InvestmentRecoverySectionProps> = ({
  totalInvestment,
  year1TaxBenefit,
  total10YearBenefits,
  benefitMultiple,
  investorCashFlows,
  formatCurrency
}) => {

  // ─────────────────────────────────────────────────────────────────────────────
  // CALCULATIONS (all derived from engine values)
  // ─────────────────────────────────────────────────────────────────────────────

  // ISS-023: Use totalInvestment (MOIC basis) for recovery calculations
  // This is net equity for Y0 syndication, gross equity for Y1+ or no syndication

  // Year 1 Coverage percentage
  const year1Coverage = totalInvestment > 0
    ? (year1TaxBenefit / totalInvestment) * 100
    : 0;

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

  // ─────────────────────────────────────────────────────────────────────────────
  // STYLING HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

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
        </div>
      </div>
    </CollapsibleSection>
  );
};

export default InvestmentRecoverySection;
