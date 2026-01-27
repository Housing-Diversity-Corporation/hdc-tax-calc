import React from 'react';
import '../../../styles/taxbenefits/hdcCalculator.css';
import CollapsibleSection from './CollapsibleSection';

interface CapitalStructureSectionProps {
  investorEquityPct: number;
  philanthropicEquityPct: number;
  seniorDebtPct: number;
  philDebtPct: number;
  hdcSubDebtPct: number;
  investorSubDebtPct: number;
  outsideInvestorSubDebtPct?: number;
  totalCapitalStructure: number;
  // IMPL-058: Dollar amounts for consolidated display
  investorEquity?: number;
  syndicatedEquityOffset?: number;
  // ISS-031: PAB display (% of project + $ amount)
  pabPctOfProject?: number;
  pabFundingAmount?: number;
  // State LIHTC Integration (IMPL-018)
  stateLIHTCProceeds?: number;
  stateLIHTCEnabled?: boolean;
  syndicationRate?: number;
  projectCost?: number;
  formatCurrency?: (value: number) => string;
}

const CapitalStructureSection: React.FC<CapitalStructureSectionProps> = ({
  investorEquityPct,
  philanthropicEquityPct,
  seniorDebtPct,
  philDebtPct,
  hdcSubDebtPct,
  investorSubDebtPct,
  outsideInvestorSubDebtPct = 0,
  totalCapitalStructure,
  // IMPL-058: Dollar amounts for consolidated display
  investorEquity = 0,
  syndicatedEquityOffset = 0,
  // ISS-031: PAB display
  pabPctOfProject = 0,
  pabFundingAmount = 0,
  // State LIHTC Integration (IMPL-018)
  stateLIHTCProceeds = 0,
  stateLIHTCEnabled = false,
  syndicationRate = 0,
  projectCost = 0,
  formatCurrency = (v) => `$${v.toFixed(2)}M`
}) => {
  const isBalanced = Math.abs(totalCapitalStructure - 100) <= 0.1;

  // Show syndication info when syndication path is active
  // Syndication path: syndicationRate > 0 and < 1.0 (not direct use)
  const showAdditionalSources = stateLIHTCEnabled && stateLIHTCProceeds > 0 && syndicationRate > 0 && syndicationRate < 1.0;

  // IMPL-058: Calculate dollar amounts from percentages
  // IMPL-074: syndicatedEquityOffset reduces net equity for MOIC/IRR calculation
  const netEquity = investorEquity - syndicatedEquityOffset;
  const philEquityAmount = projectCost * (philanthropicEquityPct / 100);
  const seniorDebtAmount = projectCost * (seniorDebtPct / 100);
  const philDebtAmount = projectCost * (philDebtPct / 100);
  const hdcSubDebtAmount = projectCost * (hdcSubDebtPct / 100);
  const investorSubDebtAmount = projectCost * (investorSubDebtPct / 100);
  const outsideInvestorSubDebtAmount = projectCost * (outsideInvestorSubDebtPct / 100);

  return (
    <CollapsibleSection title="Capital Structure">
      <div>
          {/* IMPL-058: Show both % and $ for each capital layer */}
          {/* IMPL-074: Show gross equity, offset, and net equity when syndication active */}
          <div className="hdc-result-row">
            <span className="hdc-result-label">Investor Equity (Gross):</span>
            <span className="hdc-result-value">
              {investorEquityPct.toFixed(1)}% {investorEquity > 0 && <span style={{ color: 'var(--hdc-cabbage-pont)', marginLeft: '0.5rem' }}>({formatCurrency(investorEquity)})</span>}
            </span>
          </div>
          {syndicatedEquityOffset > 0 && (
            <>
              <div className="hdc-result-row" style={{ paddingLeft: '1rem' }}>
                <span className="hdc-result-label" style={{ color: 'var(--hdc-gold)' }}>Less: Syndication Offset:</span>
                <span className="hdc-result-value" style={{ color: 'var(--hdc-gold)' }}>
                  ({formatCurrency(syndicatedEquityOffset)})
                </span>
              </div>
              <div className="hdc-result-row" style={{ paddingLeft: '1rem', fontWeight: 600 }}>
                <span className="hdc-result-label">= Net Equity (MOIC basis):</span>
                <span className="hdc-result-value" style={{ fontWeight: 600 }}>
                  {formatCurrency(netEquity)}
                </span>
              </div>
            </>
          )}
          {/* IMPL-059: Only show non-zero capital layers */}
          {philanthropicEquityPct > 0 && (
            <div className="hdc-result-row">
              <span className="hdc-result-label">Philanthropic Equity:</span>
              <span className="hdc-result-value">
                {philanthropicEquityPct.toFixed(1)}% <span style={{ color: 'var(--hdc-cabbage-pont)', marginLeft: '0.5rem' }}>({formatCurrency(philEquityAmount)})</span>
              </span>
            </div>
          )}
          {seniorDebtPct > 0 && (
            <div className="hdc-result-row">
              <span className="hdc-result-label">Senior Debt:</span>
              <span className="hdc-result-value">
                {seniorDebtPct.toFixed(1)}% <span style={{ color: 'var(--hdc-cabbage-pont)', marginLeft: '0.5rem' }}>({formatCurrency(seniorDebtAmount)})</span>
              </span>
            </div>
          )}
          {/* ISS-031: PAB shown after Senior Debt (pari passu) */}
          {pabPctOfProject > 0.1 && (
            <div className="hdc-result-row">
              <span className="hdc-result-label">Private Activity Bonds:</span>
              <span className="hdc-result-value">
                {pabPctOfProject.toFixed(1)}% <span style={{ color: 'var(--hdc-cabbage-pont)', marginLeft: '0.5rem' }}>({formatCurrency(pabFundingAmount)})</span>
              </span>
            </div>
          )}
          {philDebtPct > 0 && (
            <div className="hdc-result-row">
              <span className="hdc-result-label">Philanthropic Debt:</span>
              <span className="hdc-result-value">
                {philDebtPct.toFixed(1)}% <span style={{ color: 'var(--hdc-cabbage-pont)', marginLeft: '0.5rem' }}>({formatCurrency(philDebtAmount)})</span>
              </span>
            </div>
          )}
          {outsideInvestorSubDebtPct > 0 && (
             <div className="hdc-result-row highlight">
               <span className="hdc-result-label">Outside Investor Sub-Debt:</span>
               <span className="hdc-result-value">
                 {outsideInvestorSubDebtPct.toFixed(1)}% <span style={{ color: 'var(--hdc-cabbage-pont)', marginLeft: '0.5rem' }}>({formatCurrency(outsideInvestorSubDebtAmount)})</span>
               </span>
             </div>
           )}
           {hdcSubDebtPct > 0 && (
             <div className="hdc-result-row highlight">
               <span className="hdc-result-label">HDC Sub-Debt:</span>
               <span className="hdc-result-value">
                 {hdcSubDebtPct.toFixed(1)}% <span style={{ color: 'var(--hdc-cabbage-pont)', marginLeft: '0.5rem' }}>({formatCurrency(hdcSubDebtAmount)})</span>
               </span>
             </div>
           )}
           {investorSubDebtPct > 0 && (
             <div className="hdc-result-row highlight">
               <span className="hdc-result-label">Investor Sub-Debt:</span>
               <span className="hdc-result-value">
                 {investorSubDebtPct.toFixed(1)}% <span style={{ color: 'var(--hdc-cabbage-pont)', marginLeft: '0.5rem' }}>({formatCurrency(investorSubDebtAmount)})</span>
               </span>
             </div>
           )}
           <div className="hdc-result-row summary">
             <span className="hdc-result-label">Total:</span>
             <span className={`hdc-result-value ${isBalanced ? 'hdc-value-positive' : 'hdc-value-negative'}`}>
               {totalCapitalStructure.toFixed(1)}% {projectCost > 0 && <span style={{ marginLeft: '0.5rem' }}>({formatCurrency(projectCost)})</span>}
             </span>
           </div>

           {/* State LIHTC Syndication Info (IMPL-018, IMPL-073, IMPL-074) */}
           {showAdditionalSources && (
             <div style={{
               borderTop: '1px dashed var(--hdc-faded-jade)',
               marginTop: '0.75rem',
               paddingTop: '0.75rem'
             }}>
               <div className="hdc-result-row" style={{ marginBottom: '0.25rem' }}>
                 <span className="hdc-result-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                   State LIHTC Syndication
                 </span>
               </div>
               <div className="hdc-result-row highlight">
                 <span className="hdc-result-label">
                   Syndication Proceeds
                   <span style={{ fontSize: '0.7rem', color: '#666', marginLeft: '4px' }}>
                     ({(syndicationRate * 100).toFixed(0)}% rate)
                   </span>:
                 </span>
                 <span className="hdc-result-value hdc-value-positive">
                   {formatCurrency(stateLIHTCProceeds)}
                 </span>
               </div>
               {/* IMPL-074: Note explaining dual treatment */}
               <div style={{
                 marginTop: '0.5rem',
                 fontSize: '0.75rem',
                 color: '#666',
                 fontStyle: 'italic'
               }}>
                 * Reduces net equity for MOIC/IRR; also shown in Returns Buildup
               </div>
             </div>
           )}
         </div>
     </CollapsibleSection>
  );
};

export default CapitalStructureSection;