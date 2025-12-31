import React from 'react';
import type { CashFlowItem, InvestorAnalysisResults } from '../../../types/taxbenefits';
import { formatCashFlowMillions } from '../../../utils/taxbenefits/formatters';
import '../../../styles/taxbenefits/hdcCalculator.css';
import CollapsibleSection from './CollapsibleSection';
import InvestorCashFlowChart from './InvestorCashFlowChart';

interface InvestorCashFlowSectionProps {
  investorCashFlows: CashFlowItem[];
  holdPeriod: number;
  hdcSubDebtPct: number;
  pikCurrentPayEnabled: boolean;
  pikCurrentPayPct: number;
  investorSubDebtPct: number;
  investorPikCurrentPayEnabled: boolean;
  investorPikCurrentPayPct: number;
  exitProceeds: number;
  mainAnalysisResults: InvestorAnalysisResults;
  totalReturns: number;
  multipleOnInvested: number;
  investorIRR: number;
  totalInvestment: number;
  formatCurrency: (value: number) => string;
  taxBenefitDelayMonths?: number;
  // State LIHTC Integration (IMPL-018)
  hasStateLIHTCDirectUse?: boolean;
}

const InvestorCashFlowSection: React.FC<InvestorCashFlowSectionProps> = ({
  investorCashFlows,
  holdPeriod,
  hdcSubDebtPct,
  pikCurrentPayEnabled,
  pikCurrentPayPct,
  investorSubDebtPct,
  investorPikCurrentPayEnabled,
  investorPikCurrentPayPct,
  exitProceeds,
  mainAnalysisResults,
  totalReturns,
  multipleOnInvested,
  investorIRR,
  totalInvestment,
  formatCurrency,
  taxBenefitDelayMonths = 0,
  // State LIHTC Integration (IMPL-018)
  hasStateLIHTCDirectUse = false
}) => {
  
  // Extract Year 1 tax benefit from cash flows
  const year1TaxBenefit = investorCashFlows.length > 0 ? investorCashFlows[0].taxBenefit : 0;
  
  return (
    <CollapsibleSection title={`${holdPeriod}-Year Investor Analysis & Cash Flow Model`}>
       
       {/* Initial Investment */}
       <div style={{ marginTop: '0.5rem' }}>
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
         
         {/* Tax Benefits - Full 10-year total (includes Year 1) */}
         <div className="hdc-result-row" style={{ paddingLeft: '1rem' }}>
           <span className="hdc-result-label">Tax Benefits ({holdPeriod}-year total):</span>
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
             <span className="hdc-result-label">HDC Sub-Debt Interest Paid (Cost to Investor):</span>
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
       </div>

       {/* Investor Cash Flow Chart */}
       <InvestorCashFlowChart
         investorCashFlows={investorCashFlows}
         exitProceeds={exitProceeds}
         totalReturns={totalReturns}
         mainAnalysisResults={mainAnalysisResults}
         formatCurrency={formatCurrency}
       />

       {/* Investor Cash Flow Model */}
       <div className="p-3 bg-gray-50 rounded">
         <h3 className="text-sm font-semibold mb-3">
           Investor Returns Model
           <span className="text-xs text-gray-600 font-medium ml-2">($ in millions)</span>
           {taxBenefitDelayMonths > 0 && (
             <span className="text-xs text-orange-600 font-medium ml-2">
               Tax benefits delayed {taxBenefitDelayMonths} months
             </span>
           )}
         </h3>    
         <div className="overflow-x-auto">    
           <table className="w-full text-xs">    
             <thead>    
               <tr className="border-b">
                 <th className="text-left p-1">Year</th>
                 <th className="text-right p-1">Tax Benefit</th>
                 <th className="text-right p-1">Distributions</th>
                 <th className="text-right p-1" style={{color: '#ef4444'}}>OZ Tax</th>
                 {hasStateLIHTCDirectUse && (
                   <th className="text-right p-1" style={{color: 'var(--hdc-gold)'}}>State LIHTC</th>
                 )}
                 {hdcSubDebtPct > 0 && pikCurrentPayEnabled && (
                   <th className="text-right p-1">HDC Sub-Debt</th>
                 )}
                 {investorSubDebtPct > 0 && investorPikCurrentPayEnabled && (
                   <th className="text-right p-1">Inv Sub-Debt</th>
                 )}
                 {investorSubDebtPct > 0 && (
                   <th className="text-right p-1">PIK Accrued</th>
                 )}
                 {investorSubDebtPct > 0 && (
                   <th className="text-right p-1">PIK Balance</th>
                 )}
                 <th className="text-right p-1">Total</th>
                 <th className="text-right p-1">Cumulative</th>
               </tr>    
             </thead>    
             <tbody>    
               {investorCashFlows.map(cf => (    
                 <tr key={cf.year} className="border-b">
                   <td className="p-1">{cf.year}</td>
                   <td className="text-right p-1">{formatCashFlowMillions(cf.taxBenefit)}</td>
                   <td className="text-right p-1">{formatCashFlowMillions(cf.operatingCashFlow)}</td>
                   <td className="text-right p-1" style={{color: '#ef4444'}}>
                     {(cf.ozYear5TaxPayment || 0) > 0 ? `(${formatCashFlowMillions(cf.ozYear5TaxPayment || 0)})` : '-'}
                   </td>
                   {hasStateLIHTCDirectUse && (
                     <td className="text-right p-1" style={{color: 'var(--hdc-gold)'}}>
                       {(cf.stateLIHTCCredit || 0) > 0 ? formatCashFlowMillions(cf.stateLIHTCCredit || 0) : '-'}
                     </td>
                   )}
                   {hdcSubDebtPct > 0 && pikCurrentPayEnabled && (
                     <td className="text-right p-1" style={{color: 'var(--hdc-strikemaster)'}}>    
                       {cf.subDebtInterest > 0 ? `(${formatCashFlowMillions(cf.subDebtInterest)})` : '-'}    
                     </td>
                   )}
                   {investorSubDebtPct > 0 && investorPikCurrentPayEnabled && (
                     <td className="text-right p-1" style={{color: 'var(--hdc-cabbage-pont)'}}>    
                       {(cf.investorSubDebtInterestReceived || 0) > 0 ? formatCashFlowMillions(cf.investorSubDebtInterestReceived || 0) : '-'}    
                     </td>
                   )}
                   {investorSubDebtPct > 0 && (
                     <td className="text-right p-1" style={{color: 'var(--hdc-cabbage-pont)'}}>    
                       {(cf.investorSubDebtPIKAccrued || 0) > 0 ? formatCashFlowMillions(cf.investorSubDebtPIKAccrued || 0) : '-'}    
                     </td>
                   )}
                   {investorSubDebtPct > 0 && (
                     <td className="text-right p-1" style={{color: 'var(--hdc-cabbage-pont)'}}>    
                       {(cf.investorPikBalance || 0) > 0 ? formatCashFlowMillions(cf.investorPikBalance || 0) : '-'}    
                     </td>
                   )}
                   <td className="text-right p-1 font-medium">{formatCashFlowMillions(cf.totalCashFlow)}</td>    
                   <td className="text-right p-1" style={{color: 'var(--hdc-cabbage-pont)'}}>{formatCashFlowMillions(cf.cumulativeReturns)}</td>    
                 </tr>    
               ))}    
               <tr className="border-t-2 font-semibold">
                 <td className="p-1">Exit</td>
                 <td className="text-right p-1">-</td>
                 <td className="text-right p-1">-</td>
                 <td className="text-right p-1">-</td>
                 {hasStateLIHTCDirectUse && <td className="text-right p-1">-</td>}
                 {hdcSubDebtPct > 0 && pikCurrentPayEnabled && <td className="text-right p-1">-</td>}
                 {investorSubDebtPct > 0 && investorPikCurrentPayEnabled && <td className="text-right p-1">-</td>}
                 {investorSubDebtPct > 0 && <td className="text-right p-1">-</td>}
                 {investorSubDebtPct > 0 && <td className="text-right p-1" style={{color: 'var(--hdc-cabbage-pont)'}}>{formatCashFlowMillions(mainAnalysisResults.investorSubDebtAtExit || 0)}</td>}
                 <td className="text-right p-1">{formatCashFlowMillions(exitProceeds + (investorSubDebtPct > 0 ? mainAnalysisResults.investorSubDebtAtExit : 0))}</td>
                 <td className="text-right p-1" style={{color: 'var(--hdc-brown-rust)'}}>{formatCashFlowMillions(totalReturns)}</td>
               </tr>    
             </tbody>    
           </table>    
         </div>
         <div className="mt-2 text-xs text-gray-600">
           <div style={{color: '#ef4444'}}>• OZ Tax: Year 5 payment on pre-investment deferred gains (tracked for investor but excluded from IRR/Multiple)</div>
           {hasStateLIHTCDirectUse && <div style={{color: 'var(--hdc-gold)'}}>• State LIHTC: Direct-use credits (100% in-state investor) - included in Total and IRR</div>}
           {(hdcSubDebtPct > 0 && pikCurrentPayEnabled) && <div style={{color: 'var(--hdc-cabbage-pont)'}}>• HDC sub-debt current pay: {pikCurrentPayPct}%</div>}
           {(investorSubDebtPct > 0 && investorPikCurrentPayEnabled) && <div style={{color: 'var(--hdc-cabbage-pont)'}}>• Investor sub-debt current pay: {investorPikCurrentPayPct}%</div>}
           <div style={{color: '#666', marginTop: '0.25rem'}}>• Total column reflects investment performance (excludes pre-investment OZ tax obligation)</div>
         </div>
       </div>

     </CollapsibleSection>
  );
};

export default InvestorCashFlowSection;