import React from 'react';
import type { InvestorAnalysisResults } from '../../../types/taxbenefits';
import '../../../styles/taxbenefits/hdcCalculator.css';
import CollapsibleSection from './CollapsibleSection';

interface OutsideInvestorSectionProps {
  outsideInvestorSubDebtPct: number;
  outsideInvestorSubDebtPikRate: number;
  outsideInvestorPikCurrentPayEnabled: boolean;
  outsideInvestorPikCurrentPayPct: number;
  projectCost: number;
  mainAnalysisResults: InvestorAnalysisResults;
  formatCurrency: (value: number) => string;
  holdPeriod: number;
}

const OutsideInvestorSection: React.FC<OutsideInvestorSectionProps> = ({
  outsideInvestorSubDebtPct,
  outsideInvestorSubDebtPikRate,
  outsideInvestorPikCurrentPayEnabled,
  outsideInvestorPikCurrentPayPct,
  projectCost,
  mainAnalysisResults,
  formatCurrency,
  holdPeriod
}) => {
  // Don't render if no outside investor sub-debt
  if (outsideInvestorSubDebtPct === 0) {
    return null;
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const principal = projectCost * (outsideInvestorSubDebtPct / 100);
  const totalCost = mainAnalysisResults.outsideInvestorTotalCost || 0;
  const totalInterest = mainAnalysisResults.outsideInvestorTotalInterest || 0;
  const cashPaid = mainAnalysisResults.outsideInvestorCashPaid || 0;
  const pikAccrued = totalInterest - cashPaid;

  // Calculate multiple on invested capital
  const multipleOnCapital = principal > 0 ? (totalCost / principal) : 0;

  // Calculate annualized effective rate using compound interest formula
  // totalCost = principal * (1 + r)^years, solving for r
  const annualizedRate = principal > 0 && holdPeriod > 0
    ? (Math.pow(totalCost / principal, 1 / holdPeriod) - 1) * 100
    : 0;

  return (
    <CollapsibleSection title="Outside Investor Sub-Debt Analysis">
      <div>
        {/* Debt Structure */}
        <div style={{
          marginBottom: '0.75rem'
        }}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--hdc-cabbage-pont)',
            marginBottom: '0.25rem'
          }}>
            Debt Structure:
          </div>

          <div className="hdc-result-row">
            <span className="hdc-result-label">Principal Amount:</span>
            <span className="hdc-result-value">{formatCurrency(principal)}</span>
          </div>

          <div className="hdc-result-row">
            <span className="hdc-result-label">PIK Interest Rate:</span>
            <span className="hdc-result-value">{formatPercent(outsideInvestorSubDebtPikRate)}</span>
          </div>

          {outsideInvestorPikCurrentPayEnabled && (
            <div className="hdc-result-row">
              <span className="hdc-result-label">Current Pay Percentage:</span>
              <span className="hdc-result-value">{formatPercent(outsideInvestorPikCurrentPayPct)}</span>
            </div>
          )}
        </div>

        {/* Interest Analysis */}
        <div style={{
          borderTop: '1px solid rgba(146, 195, 194, 0.3)',
          paddingTop: '0.5rem'
        }}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--hdc-cabbage-pont)',
            marginBottom: '0.25rem'
          }}>
            Interest Analysis:
          </div>

          <div className="hdc-result-row">
            <span className="hdc-result-label">Cash Interest Paid:</span>
            <span className="hdc-result-value">{formatCurrency(cashPaid)}</span>
          </div>

          <div className="hdc-result-row">
            <span className="hdc-result-label">PIK Interest Accrued:</span>
            <span className="hdc-result-value">{formatCurrency(pikAccrued)}</span>
          </div>

          <div className="hdc-result-row">
            <span className="hdc-result-label">Total Interest Cost:</span>
            <span className="hdc-result-value">{formatCurrency(totalInterest)}</span>
          </div>

          <div className="hdc-result-row summary">
            <span className="hdc-result-label">Total Repayment at Exit:</span>
            <span className="hdc-result-value" style={{
              color: 'var(--hdc-brown-rust)',
              fontWeight: 700
            }}>
              {formatCurrency(totalCost)}
            </span>
          </div>

          <div className="hdc-result-row">
            <span className="hdc-result-label">Multiple on Capital:</span>
            <span className="hdc-result-value">{multipleOnCapital.toFixed(2)}x</span>
          </div>

          <div className="hdc-result-row">
            <span className="hdc-result-label">Annualized Effective Rate:</span>
            <span className="hdc-result-value">{formatPercent(annualizedRate)}</span>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
};

export default OutsideInvestorSection;