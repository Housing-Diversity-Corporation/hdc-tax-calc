import React from 'react';
import type { CashFlowItem, HDCCashFlowItem, InvestorAnalysisResults, HDCAnalysisResults } from '../../../types/taxbenefits';
import { formatCurrencyMillions } from '../../../utils/taxbenefits/formatters';

interface CashFlowTablesSectionProps {
  investorCashFlows: CashFlowItem[];
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
  hdcCashFlows: HDCCashFlowItem[];
  aumFeeEnabled: boolean;
  aumFeeRate: number;
  hdcAnalysisResults: HDCAnalysisResults;
  hdcExitProceeds: number;
  hdcTotalReturns: number;
  hdcMultiple: number;
  hdcIRR: number;
  hdcSubDebtPikRate: number;
}

const CashFlowTablesSection: React.FC<CashFlowTablesSectionProps> = ({
  investorCashFlows,
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
  hdcCashFlows,
  aumFeeEnabled,
  aumFeeRate,
  hdcAnalysisResults,
  hdcExitProceeds,
  hdcTotalReturns,
  hdcMultiple,
  hdcIRR,
  hdcSubDebtPikRate
}) => {
  return (
   <div className="p-4 md:p-6 rounded-lg shadow h-full" 
         style={{
          borderTop: '4px solid var(--hdc-faded-jade)',
          borderBottom: '4px solid var(--hdc-faded-jade)',
          borderRadius:'5px'}}
    >      
      <h2 className="text-lg font-semibold mb-4" style={{color: 'var(--hdc-faded-jade)'}}>Cash Flow Models</h2>
      <div className="space-y-6">

        {/* 10-Year Investor Cash Flow Model */}
        <div className="p-3 bg-gray-50 rounded">    
          <h3 className="text-sm font-semibold mb-3">10-Year Investor Cash Flow Model</h3>    
          <div className="overflow-x-auto">    
            <table className="w-full text-xs">    
              <thead>    
                <tr className="border-b">    
                  <th className="text-left p-1">Year</th>    
                  <th className="text-right p-1">NOI</th>    
                  <th className="text-right p-1">Tax Benefit</th>    
                  <th className="text-right p-1">Dist.</th>    
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
                    <td className="text-right p-1">{formatCurrencyMillions(cf.noi)}</td>    
                    <td className="text-right p-1">{formatCurrencyMillions(cf.taxBenefit)}</td>    
                    <td className="text-right p-1">{formatCurrencyMillions(cf.operatingCashFlow)}</td>
                    {hdcSubDebtPct > 0 && pikCurrentPayEnabled && (
                      <td className="text-right p-1" style={{color: 'var(--hdc-strikemaster)'}}>    
                        {cf.subDebtInterest > 0 ? `(${formatCurrencyMillions(cf.subDebtInterest).replace('$', '')})` : '-'}    
                      </td>
                    )}
                    {investorSubDebtPct > 0 && investorPikCurrentPayEnabled && (
                      <td className="text-right p-1" style={{color: 'var(--hdc-cabbage-pont)'}}>    
                        {(cf.investorSubDebtInterestReceived || 0) > 0 ? formatCurrencyMillions(cf.investorSubDebtInterestReceived || 0) : '-'}    
                      </td>
                    )}
                    {investorSubDebtPct > 0 && (
                      <td className="text-right p-1" style={{color: 'var(--hdc-cabbage-pont)'}}>    
                        {(cf.investorSubDebtPIKAccrued || 0) > 0 ? formatCurrencyMillions(cf.investorSubDebtPIKAccrued || 0) : '-'}    
                      </td>
                    )}
                    {investorSubDebtPct > 0 && (
                      <td className="text-right p-1" style={{color: 'var(--hdc-cabbage-pont)'}}>    
                        {(cf.investorPikBalance || 0) > 0 ? formatCurrencyMillions(cf.investorPikBalance || 0) : '-'}    
                      </td>
                    )}
                    <td className="text-right p-1 font-medium">{formatCurrencyMillions(cf.totalCashFlow)}</td>    
                    <td className="text-right p-1" style={{color: 'var(--hdc-cabbage-pont)'}}>{formatCurrencyMillions(cf.cumulativeReturns)}</td>    
                  </tr>    
                ))}    
                <tr className="border-t-2 font-semibold">    
                  <td className="p-1">Exit</td>    
                  <td className="text-right p-1">-</td>    
                  <td className="text-right p-1">-</td>    
                  <td className="text-right p-1">-</td>
                  {hdcSubDebtPct > 0 && pikCurrentPayEnabled && <td className="text-right p-1">-</td>}
                  {investorSubDebtPct > 0 && investorPikCurrentPayEnabled && <td className="text-right p-1">-</td>}
                  {investorSubDebtPct > 0 && <td className="text-right p-1">-</td>}
                  {investorSubDebtPct > 0 && <td className="text-right p-1" style={{color: 'var(--hdc-cabbage-pont)'}}>{formatCurrencyMillions(mainAnalysisResults.investorSubDebtAtExit || 0)}</td>}
                  <td className="text-right p-1">{formatCurrencyMillions(exitProceeds + (investorSubDebtPct > 0 ? mainAnalysisResults.investorSubDebtAtExit : 0))}</td>    
                  <td className="text-right p-1" style={{color: 'var(--hdc-brown-rust)'}}>{formatCurrencyMillions(totalReturns)}</td>    
                </tr>    
              </tbody>    
            </table>    
          </div>    
          <div className="mt-2 text-xs text-gray-600">    
            Net Return: {multipleOnInvested.toFixed(2)}x multiple, {investorIRR.toFixed(1)}% IRR    
            {hdcSubDebtPct > 0 && pikCurrentPayEnabled && <span style={{color: 'var(--hdc-cabbage-pont)'}} className="ml-2">• HDC sub-debt current pay: {pikCurrentPayPct}%</span>}
            {investorSubDebtPct > 0 && investorPikCurrentPayEnabled && <span style={{color: 'var(--hdc-cabbage-pont)'}} className="ml-2">• Investor sub-debt current pay: {investorPikCurrentPayPct}%</span>}
          </div>    
        </div>

        {/* HDC 10-Year Cash Flow Model */}
        <div className="p-3 bg-gray-50 rounded">    
          <h3 className="text-sm font-semibold mb-3">10-Year HDC Cash Flow Model</h3>    
          <div className="overflow-x-auto">    
            <table className="w-full text-xs">    
              <thead>    
                <tr className="border-b">    
                  <th className="text-left p-1">Year</th>    
                  <th className="text-right p-1">NOI</th>    
                  <th className="text-right p-1">HDC Fee</th>    
                  <th className="text-right p-1">Phil. Equity</th>    
                  {aumFeeEnabled && (
                    <th className="text-right p-1">AUM Fee</th>
                  )}
                  {hdcSubDebtPct > 0 && pikCurrentPayEnabled && (
                    <th className="text-right p-1">Current Pay</th>
                  )}
                  {hdcSubDebtPct > 0 && (
                    <th className="text-right p-1">PIK Accrued</th>
                  )}
                  {hdcSubDebtPct > 0 && (
                    <th className="text-right p-1">PIK Balance</th>
                  )}
                  <th className="text-right p-1">Total Cash</th>    
                  <th className="text-right p-1">Cumulative</th>    
                </tr>    
              </thead>    
              <tbody>    
                {hdcCashFlows.map((cf) => (    
                  <tr key={cf.year} className="border-b">    
                    <td className="p-1">{cf.year}</td>    
                    <td className="text-right p-1">{formatCurrencyMillions(cf.noi)}</td>    
                    <td className="text-right p-1">
                      {cf.hdcFeeIncome > 0 ? formatCurrencyMillions(cf.hdcFeeIncome) : '-'}
                    </td>    
                    <td className="text-right p-1">
                      {cf.philanthropicShare > 0 ? formatCurrencyMillions(cf.philanthropicShare) : '-'}
                    </td>
                    {aumFeeEnabled && (
                      <td className="text-right p-1" style={{color: 'var(--hdc-cabbage-pont)'}}>
                        {cf.aumFeeIncome > 0 ? formatCurrencyMillions(cf.aumFeeIncome) : '-'}
                      </td>
                    )}
                    {hdcSubDebtPct > 0 && pikCurrentPayEnabled && (
                      <td className="text-right p-1" style={{color: 'var(--hdc-cabbage-pont)'}}>
                        {cf.hdcSubDebtCurrentPay > 0 ? formatCurrencyMillions(cf.hdcSubDebtCurrentPay) : '-'}
                      </td>
                    )}
                    {hdcSubDebtPct > 0 && (
                      <td className="text-right p-1" style={{color: 'var(--hdc-cabbage-pont)'}}>
                        {cf.hdcSubDebtPIKAccrued > 0 ? formatCurrencyMillions(cf.hdcSubDebtPIKAccrued) : '-'}
                      </td>
                    )}
                    {hdcSubDebtPct > 0 && (
                      <td className="text-right p-1" style={{color: 'var(--hdc-cabbage-pont)'}}>
                        {cf.pikBalance > 0 ? formatCurrencyMillions(cf.pikBalance) : '-'}
                      </td>
                    )}
                    <td className="text-right p-1 font-medium">{formatCurrencyMillions(cf.totalCashFlow)}</td>    
                    <td className="text-right p-1" style={{color: 'var(--hdc-cabbage-pont)'}}>{formatCurrencyMillions(cf.cumulativeReturns)}</td>    
                  </tr>    
                ))}    
                <tr className="border-t-2 font-semibold">    
                  <td className="p-1">Exit</td>    
                  <td className="text-right p-1">-</td>    
                  <td className="text-right p-1">-</td>    
                  <td className="text-right p-1">-</td>
                  {aumFeeEnabled && <td className="text-right p-1">-</td>}
                  {hdcSubDebtPct > 0 && pikCurrentPayEnabled && <td className="text-right p-1">-</td>}
                  {hdcSubDebtPct > 0 && <td className="text-right p-1">-</td>}
                  {hdcSubDebtPct > 0 && <td className="text-right p-1" style={{color: 'var(--hdc-cabbage-pont)'}}>{formatCurrencyMillions(hdcAnalysisResults.hdcSubDebtPIKAccrued)}</td>}
                  <td className="text-right p-1">{formatCurrencyMillions(hdcExitProceeds)}</td>    
                  <td className="text-right p-1" style={{color: 'var(--hdc-brown-rust)'}}>{formatCurrencyMillions(hdcTotalReturns)}</td>    
                </tr>    
              </tbody>    
            </table>    
          </div>    
          <div className="mt-2 text-xs text-gray-600">    
            HDC Net Return: {hdcMultiple.toFixed(2)}x multiple, {hdcIRR.toFixed(1)}% IRR
            {aumFeeEnabled && <span style={{color: 'var(--hdc-cabbage-pont)'}} className="ml-2">• AUM fee: {aumFeeRate}% annually</span>}
            {hdcSubDebtPct > 0 && !pikCurrentPayEnabled && <span style={{color: 'var(--hdc-cabbage-pont)'}} className="ml-2">• Full PIK accrual ({hdcSubDebtPikRate}%)</span>}
            {hdcSubDebtPct > 0 && pikCurrentPayEnabled && <span style={{color: 'var(--hdc-cabbage-pont)'}} className="ml-2">• Current pay: {pikCurrentPayPct}% of {hdcSubDebtPikRate}%</span>}
          </div>    
        </div>
      </div>
    </div>
  );
};

export default CashFlowTablesSection;