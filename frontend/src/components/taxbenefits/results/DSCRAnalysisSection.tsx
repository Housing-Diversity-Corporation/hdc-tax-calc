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

  // IMPL-020a: Use pre-calculated shortfall from engine (single source of truth)
  const shortfall = firstOperationalYear?.dscrShortfallPct?.toFixed(1) || '0';

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
        
        {/* Recommendations if below threshold */}
        {!meetsThreshold && stabilizedDSCR > 0 && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            borderRadius: '0.25rem',
            borderLeft: '3px solid var(--hdc-strikemaster)'
          }}>
            <div style={{ 
              fontSize: '0.8rem', 
              fontWeight: 600, 
              color: 'var(--hdc-strikemaster)',
              marginBottom: '0.5rem'
            }}>
              Capital Structure Adjustment Required
            </div>
            
            <div style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
              <p style={{ margin: '0.25rem 0' }}>
                Year {stabilizedYear} DSCR of {stabilizedDSCR.toFixed(2)}x is below the {DSCR_THRESHOLD}x minimum requirement.
              </p>
              
              <p style={{ margin: '0.5rem 0', fontWeight: 600 }}>
                Recommended adjustments to achieve {DSCR_THRESHOLD}x:
              </p>
              
              <ul style={{ margin: '0.25rem 0 0 1rem', paddingLeft: '0.5rem' }}>
                <li>Increase PIK debt percentage to reduce current debt service</li>
                <li>Increase equity to reduce leverage (~{shortfall}% reduction in debt needed)</li>
                <li>Extend interest reserve period beyond 12 months</li>
                <li>Convert senior debt to subordinate PIK structure</li>
              </ul>
            </div>
          </div>
        )}
        
        {/* Success message if meets threshold */}
        {meetsThreshold && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            borderRadius: '0.25rem',
            borderLeft: '3px solid var(--hdc-faded-jade)'
          }}>
            <div style={{ 
              fontSize: '0.8rem', 
              fontWeight: 600, 
              color: 'var(--hdc-faded-jade)',
              marginBottom: '0.25rem'
            }}>
              Capital Structure Approved
            </div>
            
            <div style={{ fontSize: '0.75rem', color: 'var(--hdc-cabbage-pont)' }}>
              Deal achieves {DSCR_THRESHOLD}x minimum DSCR at stabilization. Rent growth will maintain or improve coverage.
            </div>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
};

export default DSCRAnalysisSection;