import React from 'react';
import type { InvestorAnalysisResults } from '../../../types/taxbenefits';
import '../../../styles/taxbenefits/hdcCalculator.css';

interface InvestorAnalysisSectionProps {
  totalInvestment: number;
  mainAnalysisResults: InvestorAnalysisResults;
  exitProceeds: number;
  investorSubDebtPct: number;
  totalReturns: number;
  multipleOnInvested: number;
  investorIRR: number;
  formatCurrency: (value: number) => string;
}

const InvestorAnalysisSection: React.FC<InvestorAnalysisSectionProps> = ({
  totalInvestment,
  mainAnalysisResults,
  exitProceeds,
  investorSubDebtPct,
  totalReturns,
  multipleOnInvested,
  investorIRR,
  formatCurrency
}) => {
  return (
    <div className="hdc-calculator">
      <div className="hdc-section hdc-card-highlight">
        <h3 className="hdc-section-header">INVESTOR 10-Year Analysis - Income Sources</h3>
        
        {/* Initial Investment */}
        <div className="hdc-result-row" style={{ marginBottom: '0.5rem' }}>
          <span className="hdc-result-label" style={{ fontWeight: 600 }}>Initial Investment:</span>
          <span className="hdc-result-value hdc-value-negative">
            ({formatCurrency(totalInvestment)})
          </span>
        </div>
        
        {/* Income Sources Header */}
        <div style={{ 
          fontSize: '0.75rem', 
          fontWeight: 600, 
          color: 'var(--hdc-faded-jade)',
          marginBottom: '0.25rem',
          marginTop: '0.5rem' 
        }}>
          Income Sources:
        </div>
        
        {/* Tax Benefits */}
        <div className="hdc-result-row" style={{ paddingLeft: '1rem' }}>
          <span className="hdc-result-label">Tax Benefits (10-year):</span>
          <span className="hdc-result-value hdc-value-positive">
            {formatCurrency(mainAnalysisResults.investorTaxBenefits)}
          </span>
        </div>
        
        {/* Operating Cash Flows */}
        <div className="hdc-result-row" style={{ paddingLeft: '1rem' }}>
          <span className="hdc-result-label">Operating Cash Flows:</span>
          <span className="hdc-result-value hdc-value-positive">
            {formatCurrency(mainAnalysisResults.investorOperatingCashFlows)}
          </span>
        </div>
        
        {/* Exit Proceeds */}
        <div className="hdc-result-row" style={{ paddingLeft: '1rem' }}>
          <span className="hdc-result-label">Exit Proceeds:</span>
          <span className="hdc-result-value hdc-value-positive">
            {formatCurrency(exitProceeds)}
          </span>
        </div>
        
        {/* Investor Sub-Debt Repayment */}
        {investorSubDebtPct > 0 && (
          <div className="hdc-result-row" style={{ paddingLeft: '1rem' }}>
            <span className="hdc-result-label">Investor Sub-Debt Repayment:</span>
            <span className="hdc-result-value hdc-value-positive">
              {formatCurrency(mainAnalysisResults.investorSubDebtAtExit)}
            </span>
          </div>
        )}
        
        {/* HDC Sub-Debt Interest (Cost) */}
        {mainAnalysisResults.investorSubDebtInterest > 0 && (
          <div className="hdc-result-row" style={{ paddingLeft: '1rem' }}>
            <span className="hdc-result-label">HDC Sub-Debt Interest (Years 2-10):</span>
            <span className="hdc-result-value hdc-value-negative">
              -{formatCurrency(mainAnalysisResults.investorSubDebtInterest)}
            </span>
          </div>
        )}
        
        {/* Investor Sub-Debt Interest (Income) */}
        {mainAnalysisResults.investorSubDebtInterestReceived > 0 && (
          <div className="hdc-result-row" style={{ paddingLeft: '1rem' }}>
            <span className="hdc-result-label">Investor Sub-Debt Interest:</span>
            <span className="hdc-result-value hdc-value-positive">
              {formatCurrency(mainAnalysisResults.investorSubDebtInterestReceived)}
            </span>
          </div>
        )}
        
        {/* Summary Metrics */}
        <div className="hdc-result-row summary" style={{ marginTop: '0.5rem' }}>
          <span className="hdc-result-label" style={{ 
            fontWeight: 600,
            color: 'var(--hdc-brown-rust)' 
          }}>
            Net Total Returns:
          </span>
          <span className="hdc-result-value" style={{ 
            color: 'var(--hdc-brown-rust)',
            fontWeight: 700 
          }}>
            {formatCurrency(totalReturns)}
          </span>
        </div>
        
        <div className="hdc-result-row">
          <span className="hdc-result-label" style={{ 
            fontWeight: 600,
            color: 'var(--hdc-brown-rust)' 
          }}>
            Investor Multiple:
          </span>
          <span className="hdc-result-value" style={{ 
            color: 'var(--hdc-brown-rust)',
            fontWeight: 700 
          }}>
            {multipleOnInvested.toFixed(2)}x
          </span>
        </div>
        
        <div className="hdc-result-row">
          <span className="hdc-result-label" style={{ 
            fontWeight: 600,
            color: 'var(--hdc-brown-rust)' 
          }}>
            Investor IRR:
          </span>
          <span className="hdc-result-value" style={{ 
            color: 'var(--hdc-brown-rust)',
            fontWeight: 700 
          }}>
            {investorIRR.toFixed(1)}%
          </span>
        </div>

        {/* Note about pre-investment tax */}
        <div style={{
          marginTop: '0.75rem',
          fontSize: '0.75rem',
          color: '#666',
          fontStyle: 'italic',
          borderTop: '1px solid #e0e0e0',
          paddingTop: '0.5rem'
        }}>
          * Returns exclude pre-investment deferred tax obligations
        </div>
      </div>
    </div>
  );
};

export default InvestorAnalysisSection;