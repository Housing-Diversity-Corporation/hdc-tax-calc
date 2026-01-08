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
  totalCapitalStructure: number;
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
  totalCapitalStructure,
  // State LIHTC Integration (IMPL-018)
  stateLIHTCProceeds = 0,
  stateLIHTCEnabled = false,
  syndicationRate = 0,
  projectCost = 0,
  formatCurrency = (v) => `$${v.toFixed(2)}M`
}) => {
  const isBalanced = Math.abs(totalCapitalStructure - 100) <= 0.1;

  // Show Additional Sources section when syndication path is active
  // Syndication path: syndicationRate > 0 and < 1.0 (not direct use)
  const showAdditionalSources = stateLIHTCEnabled && stateLIHTCProceeds > 0 && syndicationRate > 0 && syndicationRate < 1.0;

  // Calculate totals for summary
  const totalSources = projectCost + stateLIHTCProceeds;
  const excessCapital = stateLIHTCProceeds; // LIHTC proceeds reduce capital need

  return (
    <CollapsibleSection title="Capital Structure">
      <div>
          <div className="hdc-result-row">
             <span className="hdc-result-label">Investor Equity:</span>
             <span className="hdc-result-value">{investorEquityPct.toFixed(1)}%</span>
           </div>
           <div className="hdc-result-row">
             <span className="hdc-result-label">Philanthropic Equity:</span>
             <span className="hdc-result-value">{philanthropicEquityPct.toFixed(1)}%</span>
           </div>
           <div className="hdc-result-row">
             <span className="hdc-result-label">Senior Debt:</span>
             <span className="hdc-result-value">{seniorDebtPct.toFixed(1)}%</span>
           </div>
           <div className="hdc-result-row">
             <span className="hdc-result-label">Philanthropic Debt:</span>
             <span className="hdc-result-value">{philDebtPct.toFixed(1)}%</span>
           </div>
           {hdcSubDebtPct > 0 && (
             <div className="hdc-result-row highlight">
               <span className="hdc-result-label">HDC Sub-Debt:</span>
               <span className="hdc-result-value">{hdcSubDebtPct.toFixed(1)}%</span>
             </div>
           )}
           {investorSubDebtPct > 0 && (
             <div className="hdc-result-row highlight">
               <span className="hdc-result-label">Investor Sub-Debt:</span>
               <span className="hdc-result-value">{investorSubDebtPct.toFixed(1)}%</span>
             </div>
           )}
           <div className="hdc-result-row summary">
             <span className="hdc-result-label">Total:</span>
             <span className={`hdc-result-value ${isBalanced ? 'hdc-value-positive' : 'hdc-value-negative'}`}>
               {totalCapitalStructure.toFixed(1)}%
             </span>
           </div>

           {/* State LIHTC Additional Sources (IMPL-018) */}
           {showAdditionalSources && (
             <>
               <div style={{
                 borderTop: '1px dashed var(--hdc-faded-jade)',
                 marginTop: '0.75rem',
                 paddingTop: '0.75rem'
               }}>
                 <div className="hdc-result-row" style={{ marginBottom: '0.25rem' }}>
                   <span className="hdc-result-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                     Additional Sources
                   </span>
                 </div>
                 <div className="hdc-result-row highlight">
                   <span className="hdc-result-label">
                     State LIHTC Proceeds
                     <span style={{ fontSize: '0.7rem', color: '#666', marginLeft: '4px' }}>
                       ({(syndicationRate * 100).toFixed(0)}%)
                     </span>:
                   </span>
                   <span className="hdc-result-value hdc-value-positive">
                     {formatCurrency(stateLIHTCProceeds)}
                   </span>
                 </div>
               </div>

               {/* Summary */}
               <div style={{
                 borderTop: '1px solid var(--hdc-faded-jade)',
                 marginTop: '0.75rem',
                 paddingTop: '0.75rem'
               }}>
                 <div className="hdc-result-row">
                   <span className="hdc-result-label">Total Sources:</span>
                   <span className="hdc-result-value">{formatCurrency(totalSources)}</span>
                 </div>
                 <div className="hdc-result-row">
                   <span className="hdc-result-label">Project Cost:</span>
                   <span className="hdc-result-value">{formatCurrency(projectCost)}</span>
                 </div>
                 <div className="hdc-result-row summary">
                   <span className="hdc-result-label">Excess (Reduced Capital Need):</span>
                   <span className="hdc-result-value hdc-value-positive">{formatCurrency(excessCapital)}</span>
                 </div>
                 {/* IMPL-046: Note explaining equity offset */}
                 <div style={{
                   marginTop: '0.5rem',
                   fontSize: '0.75rem',
                   color: '#666',
                   fontStyle: 'italic'
                 }}>
                   * Syndicated proceeds reduce investor equity requirement
                 </div>
               </div>
             </>
           )}
         </div>
     </CollapsibleSection>
  );
};

export default CapitalStructureSection;