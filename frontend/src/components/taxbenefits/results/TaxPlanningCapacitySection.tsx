import React, { useState } from 'react';
import '../../../styles/taxbenefits/hdcCalculator.css';
import CollapsibleSection from './CollapsibleSection';

interface TaxPlanningCapacitySectionProps {
  totalNetTaxBenefits: number;
  totalCapitalGainsRate: number;
  investmentRecovered: number;
  effectiveTaxRateForDepreciation: number;
  depreciationRecaptureRate: number;
  year5OZTaxDue: number;
  formatCurrency: (value: number) => string;
  // New props for depreciation details
  yearOneDepreciation?: number;
  yearOneDepreciationPct?: number;
  years2to10Depreciation?: number;
  total10YearDepreciation?: number;
  depreciableBasis?: number;
  annualStraightLineDepreciation?: number;
  totalTaxBenefit?: number;
  hdcFee?: number;
  // Unified Benefits Summary (v7.0.14)
  investorEquity?: number;
  federalLihtcTotalCredits?: number;
  stateLihtcTotalCredits?: number;
  stateLihtcEnabled?: boolean;
  ozDeferralNPV?: number;
  ozEnabled?: boolean;
  // IMPL-020a: Pre-calculated benefits from engine (single source of truth)
  total10YearBenefits?: number;
  benefitMultiple?: number;
  excessBenefits?: number;
}

const TaxPlanningCapacitySection: React.FC<TaxPlanningCapacitySectionProps> = ({
  totalNetTaxBenefits,
  totalCapitalGainsRate,
  investmentRecovered,
  effectiveTaxRateForDepreciation,
  depreciationRecaptureRate,
  year5OZTaxDue,
  formatCurrency,
  yearOneDepreciation,
  yearOneDepreciationPct,
  years2to10Depreciation,
  total10YearDepreciation,
  depreciableBasis,
  annualStraightLineDepreciation,
  totalTaxBenefit,
  hdcFee,
  // Unified Benefits Summary (v7.0.14)
  investorEquity,
  federalLihtcTotalCredits,
  stateLihtcTotalCredits,
  stateLihtcEnabled,
  ozDeferralNPV,
  ozEnabled,
  // IMPL-020a: Pre-calculated benefits from engine (single source of truth)
  total10YearBenefits: propsTotal10YearBenefits,
  benefitMultiple: propsBenefitMultiple,
  excessBenefits: propsExcessBenefits
}) => {
  const [depreciationExpanded, setDepreciationExpanded] = useState(false);

  // IMPL-020a: Use pre-calculated values from engine, fall back to local calc for backwards compatibility
  const total10YearBenefits = propsTotal10YearBenefits ?? (
    totalNetTaxBenefits +
    (federalLihtcTotalCredits || 0) +
    (stateLihtcEnabled ? (stateLihtcTotalCredits || 0) : 0) +
    (ozEnabled ? (ozDeferralNPV || 0) : 0)
  );

  const benefitMultiple = propsBenefitMultiple ?? (
    investorEquity && investorEquity > 0 ? total10YearBenefits / investorEquity : 0
  );

  const excessBenefits = propsExcessBenefits ?? Math.max(0, totalNetTaxBenefits - investmentRecovered - year5OZTaxDue);

  // Use the effective tax rate which includes both federal and state
  const ordinaryIncomeRate = effectiveTaxRateForDepreciation;

  return (
    <CollapsibleSection title="Tax Planning Capacity">
      <div>
         {/* 10-Year Benefits Summary (v7.0.14) */}
         <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(146, 195, 194, 0.3)' }}>
           <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--hdc-faded-jade)', marginBottom: '0.75rem' }}>
             10-Year Benefits Summary
           </div>

           <div className="hdc-result-row">
             <span className="hdc-result-label">Depreciation Tax Benefit:</span>
             <span className="hdc-result-value">{formatCurrency(totalNetTaxBenefits)}</span>
           </div>

           {federalLihtcTotalCredits !== undefined && federalLihtcTotalCredits > 0 && (
             <div className="hdc-result-row">
               <span className="hdc-result-label">Federal LIHTC Credits:</span>
               <span className="hdc-result-value">{formatCurrency(federalLihtcTotalCredits)}</span>
             </div>
           )}

           {stateLihtcEnabled && stateLihtcTotalCredits !== undefined && stateLihtcTotalCredits > 0 && (
             <div className="hdc-result-row">
               <span className="hdc-result-label">State LIHTC Credits:</span>
               <span className="hdc-result-value">{formatCurrency(stateLihtcTotalCredits)}</span>
             </div>
           )}

           {ozEnabled && ozDeferralNPV !== undefined && ozDeferralNPV > 0 && (
             <div className="hdc-result-row">
               <span className="hdc-result-label">OZ Deferral NPV:</span>
               <span className="hdc-result-value">{formatCurrency(ozDeferralNPV)}</span>
             </div>
           )}

           <div className="hdc-result-row summary" style={{ borderTop: '1px solid rgba(146, 195, 194, 0.3)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
             <span className="hdc-result-label" style={{ fontWeight: 600 }}>Total 10-Year Benefits:</span>
             <span className="hdc-result-value hdc-value-positive" style={{ fontWeight: 700 }}>
               {formatCurrency(total10YearBenefits)}
             </span>
           </div>

           {investorEquity && investorEquity > 0 && (
             <div className="hdc-result-row" style={{ marginTop: '0.5rem' }}>
               <span className="hdc-result-label">Benefit Multiple (Total ÷ Equity):</span>
               <span className="hdc-result-value" style={{ fontWeight: 600, color: 'var(--hdc-brown-rust)' }}>
                 {benefitMultiple.toFixed(1)}x
               </span>
             </div>
           )}
         </div>

         {/* Combined Depreciation Schedule & Tax Calculation */}
         {total10YearDepreciation !== undefined && (
           <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(146, 195, 194, 0.3)' }}>
             <h4
               style={{
                 fontSize: '0.95rem',
                 fontWeight: 600,
                 color: 'var(--hdc-cabbage-pont)',
                 marginBottom: depreciationExpanded ? '1rem' : 0,
                 cursor: 'pointer'
               }}
               onClick={() => setDepreciationExpanded(!depreciationExpanded)}
             >
               <span style={{ marginRight: '0.5rem' }}>
                 {depreciationExpanded ? '▼' : '▶'}
               </span>
               Depreciation Schedule & Tax Benefit Calculation
             </h4>

             {depreciationExpanded && (
               <div style={{ paddingLeft: '0.5rem' }}>
                 {/* Depreciation Schedule */}
                 <div style={{ marginBottom: '1rem' }}>
                   <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--hdc-faded-jade)', marginBottom: '0.5rem' }}>
                     Depreciation Schedule:
                   </div>
                   <div className="hdc-result-row">
                     <span className="hdc-result-label">Year 1 ({yearOneDepreciationPct}% bonus):</span>
                     <span className="hdc-result-value">{formatCurrency(yearOneDepreciation || 0)}</span>
                   </div>
                   <div className="hdc-result-row">
                     <span className="hdc-result-label">Years 2-10 (straight-line):</span>
                     <span className="hdc-result-value">{formatCurrency(years2to10Depreciation || 0)}</span>
                   </div>
                   <div className="hdc-result-row summary">
                     <span className="hdc-result-label">Total 10-Year Depreciation:</span>
                     <span className="hdc-result-value hdc-value-positive">{formatCurrency(total10YearDepreciation || 0)}</span>
                   </div>
                   <div style={{ marginTop: '0.375rem', fontSize: '0.7rem', color: 'var(--hdc-cabbage-pont)' }}>
                     Depreciable Base: {formatCurrency(depreciableBasis || 0)} | Annual Straight-Line: {formatCurrency(annualStraightLineDepreciation || 0)}
                   </div>
                 </div>

                 {/* Tax Benefit Calculation */}
                 <div>
                   <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--hdc-faded-jade)', marginBottom: '0.5rem' }}>
                     Tax Benefit Calculation:
                   </div>
                   <div className="hdc-result-row">
                     <span className="hdc-result-label">Total Depreciation:</span>
                     <span className="hdc-result-value">{formatCurrency(total10YearDepreciation || 0)}</span>
                   </div>
                   <div className="hdc-result-row">
                     <span className="hdc-result-label">× Tax Rate:</span>
                     <span className="hdc-result-value">{effectiveTaxRateForDepreciation?.toFixed(1)}%</span>
                   </div>
                   <div className="hdc-result-row summary">
                     <span className="hdc-result-label">= Tax Benefit:</span>
                     <span className="hdc-result-value hdc-value-positive">{formatCurrency(totalTaxBenefit || 0)}</span>
                   </div>
                 </div>
               </div>
             )}
           </div>
         )}

         {/* Tax Benefit Waterfall */}
         <div style={{
           marginBottom: '0.75rem'
         }}>
           <div style={{
             fontSize: '0.75rem',
             fontWeight: 600,
             color: 'var(--hdc-cabbage-pont)',
             marginBottom: '0.25rem'
           }}>
             Tax Benefit Allocation:
           </div>

           <div className="hdc-result-row">
             <span className="hdc-result-label">Total Net Tax Benefits:</span>
             <span className="hdc-result-value">{formatCurrency(totalNetTaxBenefits)}</span>
           </div>

           <div className="hdc-result-row">
             <span className="hdc-result-label">Less: Year 1 benefit used for equity recovery:</span>
             <span className="hdc-result-value hdc-value-negative">
               ({formatCurrency(investmentRecovered)})
             </span>
           </div>

           <div className="hdc-result-row">
             <span className="hdc-result-label">Less: Year 5 OZ tax payment:</span>
             <span className="hdc-result-value hdc-value-negative">
               ({formatCurrency(year5OZTaxDue)})
             </span>
           </div>

           <div className="hdc-result-row summary" style={{
             borderTop: '1px solid rgba(146, 195, 194, 0.3)',
             paddingTop: '0.75rem',
             marginTop: '0.5rem'
           }}>
             <span className="hdc-result-label" style={{ fontWeight: 600, color: 'var(--hdc-brown-rust)' }}>
               Net Available for Tax Planning:
             </span>
             <span className="hdc-result-value" style={{ fontWeight: 700, color: 'var(--hdc-brown-rust)' }}>
               {formatCurrency(totalNetTaxBenefits - investmentRecovered - year5OZTaxDue)}
             </span>
           </div>

         </div>

         {/* Planning Details */}
         <div style={{
           borderTop: '1px solid rgba(146, 195, 194, 0.3)',
           paddingTop: '0.5rem',
           marginTop: '0.5rem'
         }}>
           <div
             style={{
               fontSize: '0.75rem',
               fontWeight: 600,
               color: 'var(--hdc-cabbage-pont)',
               marginBottom: '0.5rem'
             }}
           >
             Planning Details
           </div>

           <div>
             {/* Planning Capacity Options */}
             <div style={{ marginBottom: '0.5rem' }}>
               <div className="hdc-result-row">
                 <span className="hdc-result-label">1031 Exchange Capacity:</span>
                 <span className="hdc-result-value">{formatCurrency(excessBenefits / (totalCapitalGainsRate / 100))}</span>
               </div>
               <div className="hdc-result-row">
                 <span className="hdc-result-label">Roth Conversion Capacity:</span>
                 <span className="hdc-result-value">{formatCurrency(excessBenefits / (ordinaryIncomeRate / 100))}</span>
               </div>
               <div className="hdc-result-row">
                 <span className="hdc-result-label">Depreciation Offset:</span>
                 <span className="hdc-result-value">{formatCurrency(excessBenefits / (depreciationRecaptureRate / 100))}</span>
               </div>
             </div>

             {/* Tax Rates Reference */}
             <div style={{
               padding: '0.375rem',
               borderRadius: '0.25rem',
               borderLeft: '2px solid var(--hdc-faded-jade)',
               fontSize: '0.7rem'
             }}>
               <div className="hdc-result-row">
                 <span className="hdc-result-label">Capital Gains Rate:</span>
                 <span className="hdc-result-value">{totalCapitalGainsRate.toFixed(1)}%</span>
               </div>
               <div className="hdc-result-row">
                 <span className="hdc-result-label">Ordinary Income Rate:</span>
                 <span className="hdc-result-value">{ordinaryIncomeRate.toFixed(1)}%</span>
               </div>
               <div className="hdc-result-row">
                 <span className="hdc-result-label">Depreciation Recapture:</span>
                 <span className="hdc-result-value">{depreciationRecaptureRate}%</span>
               </div>
             </div>
           </div>
         </div>
      </div>
    </CollapsibleSection>
  );
};

export default TaxPlanningCapacitySection;