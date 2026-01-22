import React from 'react';
import type { CashFlowItem } from '../../../types/taxbenefits';
import '../../../styles/taxbenefits/hdcCalculator.css';
import CollapsibleSection from './CollapsibleSection';

interface DSCRAnalysisSectionProps {
  investorCashFlows: CashFlowItem[];
  holdPeriod: number;
  formatCurrency: (value: number) => string;
}

const DSCRAnalysisSection: React.FC<DSCRAnalysisSectionProps> = ({
  investorCashFlows
}) => {
  // Find first year with meaningful debt service (indicates end of interest reserve period)
  // This is when the property needs to support itself operationally
  const firstOperationalYear = investorCashFlows.find(cf => 
    cf.debtServicePayments > 0 && cf.year > 1
  ) || investorCashFlows.find(cf => cf.year === 2);
  
  const stabilizedYear = firstOperationalYear?.year || 2;
  const stabilizedDSCR = firstOperationalYear?.dscr || 0;
  const stabilizedDSCRWithCurrentPay = firstOperationalYear?.dscrWithCurrentPay || 0;

  const DSCR_THRESHOLD = 1.05;
  const meetsThreshold = stabilizedDSCR >= DSCR_THRESHOLD;

  return (
    <CollapsibleSection title="Debt Service Coverage Analysis">
      <div>
        {/* Single metric focus */}
        <div className="hdc-result-row">
          <span className="hdc-result-label">Year {stabilizedYear} DSCR (Stabilized):</span>
          <span className="hdc-result-value" style={{
            color: stabilizedDSCR < 1.0 ? 'var(--hdc-strikemaster)' : 
                   stabilizedDSCR < DSCR_THRESHOLD ? 'var(--hdc-cabbage-pont)' : 
                   'var(--hdc-faded-jade)',
            fontWeight: 600
          }}>
            {stabilizedDSCR.toFixed(2)}x
          </span>
        </div>
        
        <div className="hdc-result-row">
          <span className="hdc-result-label">Required Minimum:</span>
          <span className="hdc-result-value">
            {DSCR_THRESHOLD.toFixed(2)}x
          </span>
        </div>

        {/* DSCR including all current pay obligations */}
        <div className="hdc-result-row" style={{
          paddingTop: '0.5rem',
          borderTop: '1px solid rgba(146, 195, 194, 0.2)'
        }}>
          <span className="hdc-result-label">
            DSCR with All Current Pay:
            <span style={{
              fontSize: '0.7rem',
              color: 'var(--hdc-brown-rust)',
              display: 'block',
              fontWeight: 400,
              marginTop: '2px'
            }}>
              (Including sub-debt current pay)
            </span>
          </span>
          <span className="hdc-result-value" style={{
            color: stabilizedDSCRWithCurrentPay < 1.0 ? 'var(--hdc-strikemaster)' :
                   stabilizedDSCRWithCurrentPay < DSCR_THRESHOLD ? 'var(--hdc-cabbage-pont)' :
                   'var(--hdc-faded-jade)'
          }}>
            {stabilizedDSCRWithCurrentPay.toFixed(2)}x
          </span>
        </div>
        
        <div className="hdc-result-row summary">
          <span className="hdc-result-label">Underwriting Status:</span>
          <span className="hdc-result-value" style={{
            color: meetsThreshold ? 'var(--hdc-faded-jade)' : 'var(--hdc-strikemaster)',
            fontWeight: 700
          }}>
            {meetsThreshold ? 'APPROVED' : 'NEEDS ADJUSTMENT'}
          </span>
        </div>
      </div>
    </CollapsibleSection>
  );
};

export default DSCRAnalysisSection;