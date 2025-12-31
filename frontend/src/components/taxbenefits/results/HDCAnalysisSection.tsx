import React from 'react';
import type { HDCAnalysisResults } from '../../../types/taxbenefits';
import '../../../styles/taxbenefits/hdcCalculator.css';
import CollapsibleSection from './CollapsibleSection';

interface HDCAnalysisSectionProps {
  hdcAnalysisResults: HDCAnalysisResults;
  aumFeeEnabled: boolean;
  aumFeeRate: number;
  hdcSubDebtPct: number;
  pikCurrentPayEnabled: boolean;
  pikCurrentPayPct: number;
  hdcSubDebtPikRate: number;
  investorPromoteShare: number;
  hdcTotalReturns: number;
  philanthropicEquityPct: number;
  formatCurrency: (value: number) => string;
}

const HDCAnalysisSection: React.FC<HDCAnalysisSectionProps> = ({
  hdcAnalysisResults,
  aumFeeEnabled,
  aumFeeRate,
  hdcSubDebtPct,
  pikCurrentPayEnabled,
  pikCurrentPayPct,
  investorPromoteShare,
  hdcTotalReturns,
  philanthropicEquityPct,
  formatCurrency
}) => {
  return (
    <CollapsibleSection title="HDC 10-Year Analysis - Income Sources">    
        
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
        <div className="hdc-result-row" style={{ paddingLeft: '1rem' }}>    
          <span className="hdc-result-label">HDC Fee (Year 1):</span>    
          <span className="hdc-result-value hdc-value-positive">{formatCurrency(hdcAnalysisResults.hdcFeeIncome)}</span>    
        </div>    
        <div className="hdc-result-row" style={{ paddingLeft: '1rem' }}>    
          <span className="hdc-result-label">Philanthropic Equity Distributions:</span>    
          <span className="hdc-result-value hdc-value-positive">{formatCurrency(hdcAnalysisResults.hdcPhilanthropicIncome)}</span>    
        </div>
        {aumFeeEnabled && (
          <div className="hdc-result-row" style={{ paddingLeft: '1rem' }}>    
            <span className="hdc-result-label">AUM Fee Income ({aumFeeRate}%):</span>    
            <span className="hdc-result-value hdc-value-positive">{formatCurrency(hdcAnalysisResults.hdcAumFeeIncome)}</span>    
          </div>
        )}
        {hdcSubDebtPct > 0 && pikCurrentPayEnabled && (
          <div className="hdc-result-row" style={{ paddingLeft: '1rem' }}>    
            <span className="hdc-result-label">Sub-Debt Current Pay ({pikCurrentPayPct}%):</span>    
            <span className="hdc-result-value hdc-value-positive">{formatCurrency(hdcAnalysisResults.hdcSubDebtCurrentPayIncome)}</span>    
          </div>
        )}
        {hdcSubDebtPct > 0 && (
          <div className="hdc-result-row" style={{ paddingLeft: '1rem' }}>    
            <span className="hdc-result-label">Sub-Debt PIK Accrued:</span>    
            <span className="hdc-result-value" style={{ color: 'var(--hdc-cabbage-pont)' }}>{formatCurrency(hdcAnalysisResults.hdcSubDebtPIKAccrued)}</span>    
          </div>
        )}
        
        {/* Exit Proceeds Header */}
        <div style={{ 
          fontSize: '0.75rem', 
          fontWeight: 600, 
          color: 'var(--hdc-faded-jade)',
          marginBottom: '0.25rem',
          marginTop: '0.5rem',
          paddingTop: '0.5rem',
          borderTop: '1px solid rgba(146, 195, 194, 0.3)'
        }}>
          Exit Proceeds:
        </div>    
        <div className="hdc-result-row" style={{ paddingLeft: '1rem' }}>    
          <span className="hdc-result-label">HDC Promote at Exit ({100 - investorPromoteShare}% of proceeds):</span>    
          <span className="hdc-result-value hdc-value-positive">{formatCurrency(hdcAnalysisResults.hdcPromoteProceeds)}</span>    
        </div>    
        <div className="hdc-result-row" style={{ paddingLeft: '1rem' }}>    
          <span className="hdc-result-label">Philanthropic Equity Repayment:</span>    
          <span className="hdc-result-value hdc-value-positive">{formatCurrency(hdcAnalysisResults.philanthropicEquityRepayment)}</span>    
        </div>    
        {hdcSubDebtPct > 0 && (
          <div className="hdc-result-row" style={{ paddingLeft: '1rem' }}>    
            <span className="hdc-result-label">Sub-Debt Repayment:</span>    
            <span className="hdc-result-value hdc-value-positive">{formatCurrency(hdcAnalysisResults.hdcSubDebtRepayment)}</span>    
          </div>
        )}
        
        {/* Summary Metrics */}
        <div className="hdc-result-row summary" style={{ marginTop: '0.5rem' }}>    
          <span className="hdc-result-label">Total HDC Returns:</span>    
          <span className="hdc-result-value" style={{ 
            color: 'var(--hdc-brown-rust)'
          }}>
            {formatCurrency(hdcTotalReturns)}
          </span>    
        </div>    
        
        {philanthropicEquityPct > 0 && (
          <>
            <div className="hdc-result-row">    
              <span className="hdc-result-label">Initial Philanthropic Investment:</span>    
              <span className="hdc-result-value hdc-value-negative">({formatCurrency(hdcAnalysisResults.hdcInitialInvestment)})</span>    
            </div>    
            <div className="hdc-result-row">    
              <span className="hdc-result-label" style={{ 
                fontWeight: 600,
                color: 'var(--hdc-brown-rust)' 
              }}>
                Net HDC Gain:
              </span>    
              <span className="hdc-result-value" style={{ 
                color: 'var(--hdc-brown-rust)',
                fontWeight: 700 
              }}>
                {formatCurrency(hdcTotalReturns - hdcAnalysisResults.hdcInitialInvestment)}
              </span>    
            </div>
          </>
        )}
    </CollapsibleSection>
  );
};

export default HDCAnalysisSection;