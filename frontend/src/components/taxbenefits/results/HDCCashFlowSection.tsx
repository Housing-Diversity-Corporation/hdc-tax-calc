import React, { useState } from 'react';
import type { HDCCashFlowItem, HDCAnalysisResults } from '../../../types/taxbenefits';
import { formatCashFlowMillions } from '../../../utils/taxbenefits/formatters';
import '../../../styles/taxbenefits/hdcCalculator.css';
import HDCCashFlowChart from './HDCCashFlowChart';

interface HDCCashFlowSectionProps {
  hdcCashFlows: HDCCashFlowItem[];
  holdPeriod: number;
  aumFeeEnabled: boolean;
  aumFeeRate: number;
  hdcAnalysisResults: HDCAnalysisResults;
  hdcExitProceeds: number;
  hdcTotalReturns: number;
  hdcMultiple: number;
  hdcIRR: number;
  hdcSubDebtPct: number;
  hdcSubDebtPikRate: number;
  pikCurrentPayEnabled: boolean;
  pikCurrentPayPct: number;
  investorPromoteShare: number;
  formatCurrency: (value: number) => string;
}

const HDCCashFlowSection: React.FC<HDCCashFlowSectionProps> = ({
  hdcCashFlows,
  holdPeriod,
  aumFeeEnabled,
  aumFeeRate,
  hdcAnalysisResults,
  hdcExitProceeds,
  hdcTotalReturns,
  hdcMultiple: _hdcMultiple, // eslint-disable-line @typescript-eslint/no-unused-vars
  hdcIRR: _hdcIRR, // eslint-disable-line @typescript-eslint/no-unused-vars
  hdcSubDebtPct,
  hdcSubDebtPikRate,
  pikCurrentPayEnabled,
  pikCurrentPayPct,
  investorPromoteShare,
  formatCurrency
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="hdc-section">
      <h3
        className="hdc-section-header"
        style={{ cursor: 'pointer', position: 'relative' }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span style={{ marginRight: '0.5rem' }}>
          {isExpanded ? '▼' : '▶'}
        </span>
        {holdPeriod}-Year HDC Analysis & Cash Flow Model
      </h3>

      {isExpanded && (
        <>
          {/* Income Sources */}
          <div style={{ marginTop: '0.5rem' }}>
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

            {/* Tax Benefits from Fees */}
            <div className="hdc-result-row" style={{ paddingLeft: '1rem' }}>
              <span className="hdc-result-label">Tax Benefits from Fees:</span>
              <span className="hdc-result-value hdc-value-positive">
                {formatCurrency(hdcAnalysisResults.hdcTaxBenefitFromFees || 0)}
              </span>
            </div>

            {/* AUM Fees */}
            {aumFeeEnabled && (
              <div className="hdc-result-row" style={{ paddingLeft: '1rem' }}>
                <span className="hdc-result-label">AUM Fees ({aumFeeRate}%):</span>
                <span className="hdc-result-value hdc-value-positive">
                  {formatCurrency(hdcAnalysisResults.hdcAumFees || 0)}
                </span>
              </div>
            )}

            {/* Promote Share */}
            <div className="hdc-result-row" style={{ paddingLeft: '1rem' }}>
              <span className="hdc-result-label">Promote Share ({100 - investorPromoteShare}% of total):</span>
              <span className="hdc-result-value hdc-value-positive">
                {formatCurrency(hdcAnalysisResults.hdcPromoteShare || 0)}
              </span>
            </div>

            {/* HDC Exit Proceeds with Breakdown */}
            <div style={{ marginTop: '1rem', paddingLeft: '1rem' }}>
              <div className="hdc-result-row" style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--hdc-brown-rust)',
                borderBottom: '1px solid #e0e0e0',
                paddingBottom: '0.25rem',
                marginBottom: '0.5rem'
              }}>
                <span>Exit Proceeds Breakdown:</span>
              </div>

              {/* Exit Value */}
              <div className="hdc-result-row" style={{ paddingLeft: '1rem', fontSize: '0.85rem' }}>
                <span className="hdc-result-label">Property Exit Value:</span>
                <span className="hdc-result-value">
                  {formatCurrency(hdcAnalysisResults.exitValue || 0)}
                </span>
              </div>

              {/* Less: Remaining Debt */}
              <div className="hdc-result-row" style={{ paddingLeft: '1rem', fontSize: '0.85rem' }}>
                <span className="hdc-result-label">Less: Remaining Senior & Phil Debt:</span>
                <span className="hdc-result-value" style={{color: 'var(--hdc-strikemaster)'}}>
                  ({formatCurrency(hdcAnalysisResults.remainingDebt || 0)})
                </span>
              </div>

              {/* Less: HDC Sub-Debt */}
              {(hdcAnalysisResults.hdcSubDebtAtExit || 0) > 0 && (
                <div className="hdc-result-row" style={{ paddingLeft: '1rem', fontSize: '0.85rem' }}>
                  <span className="hdc-result-label">Less: HDC Sub-Debt Repayment:</span>
                  <span className="hdc-result-value" style={{color: 'var(--hdc-strikemaster)'}}>
                    ({formatCurrency(hdcAnalysisResults.hdcSubDebtAtExit || 0)})
                  </span>
                </div>
              )}

              {/* Less: Outside Investor Sub-Debt */}
              {(hdcAnalysisResults.outsideInvestorSubDebtAtExit || 0) > 0 && (
                <div className="hdc-result-row" style={{ paddingLeft: '1rem', fontSize: '0.85rem' }}>
                  <span className="hdc-result-label">Less: Outside Investor Sub-Debt:</span>
                  <span className="hdc-result-value" style={{color: 'var(--hdc-strikemaster)'}}>
                    ({formatCurrency(hdcAnalysisResults.outsideInvestorSubDebtAtExit || 0)})
                  </span>
                </div>
              )}

              {/* Gross Exit Proceeds */}
              <div className="hdc-result-row" style={{
                paddingLeft: '1rem',
                fontSize: '0.85rem',
                borderTop: '1px solid #e0e0e0',
                paddingTop: '0.25rem',
                marginTop: '0.25rem'
              }}>
                <span className="hdc-result-label" style={{fontWeight: 600}}>= Gross Exit Proceeds:</span>
                <span className="hdc-result-value" style={{fontWeight: 600}}>
                  {formatCurrency(hdcAnalysisResults.grossExitProceeds || 0)}
                </span>
              </div>

              {/* HDC Components */}
              <div style={{ marginTop: '0.75rem' }}>
                <div className="hdc-result-row" style={{ paddingLeft: '1rem', fontSize: '0.85rem' }}>
                  <span className="hdc-result-label">HDC Promote ({100 - investorPromoteShare}%){(hdcAnalysisResults as any).hdcCatchUpAtExit ? ' + Catch-up' : ''}:</span>
                  <span className="hdc-result-value hdc-value-positive">
                    {formatCurrency(hdcAnalysisResults.hdcPromoteProceeds || 0)}
                  </span>
                </div>

                {(hdcAnalysisResults.hdcSubDebtAtExit || 0) > 0 && (
                  <div className="hdc-result-row" style={{ paddingLeft: '1rem', fontSize: '0.85rem' }}>
                    <span className="hdc-result-label">+ HDC Sub-Debt Collection:</span>
                    <span className="hdc-result-value hdc-value-positive">
                      {formatCurrency(hdcAnalysisResults.hdcSubDebtAtExit || 0)}
                    </span>
                  </div>
                )}

                {(hdcAnalysisResults.accumulatedAumFeesAtExit || 0) > 0 && (
                  <div className="hdc-result-row" style={{ paddingLeft: '1rem', fontSize: '0.85rem' }}>
                    <span className="hdc-result-label">+ Accumulated AUM Fees:</span>
                    <span className="hdc-result-value hdc-value-positive">
                      {formatCurrency(hdcAnalysisResults.accumulatedAumFeesAtExit || 0)}
                    </span>
                  </div>
                )}

                {(hdcAnalysisResults.hdcDeferredTaxFeesAtExit || 0) > 0 && (
                  <div className="hdc-result-row" style={{ paddingLeft: '1rem', fontSize: '0.85rem' }}>
                    <span className="hdc-result-label">+ Deferred Tax Benefit Fees:</span>
                    <span className="hdc-result-value hdc-value-positive">
                      {formatCurrency(hdcAnalysisResults.hdcDeferredTaxFeesAtExit || 0)}
                    </span>
                  </div>
                )}

                <div className="hdc-result-row" style={{
                  paddingLeft: '1rem',
                  fontSize: '0.9rem',
                  borderTop: '1px solid #e0e0e0',
                  paddingTop: '0.25rem',
                  marginTop: '0.25rem',
                  fontWeight: 700
                }}>
                  <span className="hdc-result-label" style={{color: 'var(--hdc-brown-rust)'}}>= Total HDC Exit Proceeds:</span>
                  <span className="hdc-result-value hdc-value-positive">
                    {formatCurrency(hdcExitProceeds)}
                  </span>
                </div>
              </div>
            </div>

            {/* HDC Sub-Debt Interest */}
            {hdcSubDebtPct > 0 && (
              <>
                <div className="hdc-result-row" style={{ paddingLeft: '1rem' }}>
                  <span className="hdc-result-label">HDC Sub-Debt Interest:</span>
                  <span className="hdc-result-value hdc-value-positive">
                    {formatCurrency(hdcAnalysisResults.hdcSubDebtInterest || 0)}
                  </span>
                </div>
                <div className="hdc-result-row" style={{ paddingLeft: '1rem' }}>
                  <span className="hdc-result-label">HDC Sub-Debt Repayment:</span>
                  <span className="hdc-result-value hdc-value-positive">
                    {formatCurrency(hdcAnalysisResults.hdcSubDebtAtExit || 0)}
                  </span>
                </div>
              </>
            )}

            {/* Summary Metrics */}
            <div className="hdc-result-row summary" style={{ marginTop: '0.5rem' }}>
              <span className="hdc-result-label" style={{
                fontWeight: 600,
                color: 'var(--hdc-brown-rust)'
              }}>
                HDC Total Returns:
              </span>
              <span className="hdc-result-value" style={{
                color: 'var(--hdc-brown-rust)',
                fontWeight: 700
              }}>
                {formatCurrency(hdcTotalReturns)}
              </span>
            </div>
          </div>

          {/* HDC Cash Flow Chart */}
          <HDCCashFlowChart
            key={`hdc-chart-${investorPromoteShare}-${hdcCashFlows.length}-${hdcTotalReturns}`}
            hdcCashFlows={hdcCashFlows}
            hdcExitProceeds={hdcExitProceeds}
            hdcTotalReturns={hdcTotalReturns}
            hdcAnalysisResults={hdcAnalysisResults}
            formatCurrency={formatCurrency}
          />

          {/* HDC Cash Flow Model */}
          <div className="p-3 bg-gray-50 rounded">
            <h3 className="text-sm font-semibold mb-3">
              Cash Flow Model
              <span className="text-xs text-gray-600 font-medium ml-2">($ in millions)</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-1">Year</th>
                    <th className="text-right p-1">Tax Ben.</th>
                    <th className="text-right p-1">Tax Def.</th>
                    {aumFeeEnabled && (
                      <>
                        <th className="text-right p-1">AUM Paid</th>
                        <th className="text-right p-1">AUM Def.</th>
                      </>
                    )}
                    {hdcSubDebtPct > 0 && pikCurrentPayEnabled && (
                      <th className="text-right p-1">Sub-Debt Int</th>
                    )}
                    {hdcSubDebtPct > 0 && (
                      <>
                        <th className="text-right p-1">PIK Accrued</th>
                        <th className="text-right p-1">PIK Balance</th>
                      </>
                    )}
                    <th className="text-right p-1">Promote</th>
                    <th className="text-right p-1">Total</th>
                    <th className="text-right p-1">Cumulative</th>
                  </tr>
                </thead>
                <tbody>
                  {hdcCashFlows.map(cf => (
                    <tr key={cf.year} className="border-b">
                      <td className="p-1">{cf.year}</td>
                      <td className="text-right p-1">{formatCashFlowMillions(cf.hdcFeeIncome)}</td>
                      <td className="text-right p-1" style={{color: (cf.hdcFeeDeferred || 0) > 0 ? 'var(--hdc-strikemaster)' : 'inherit'}}>
                        {(cf.hdcFeeDeferred || 0) > 0 ? formatCashFlowMillions(cf.hdcFeeDeferred || 0) : '-'}
                      </td>
                      {aumFeeEnabled && (
                        <>
                          <td className="text-right p-1">{formatCashFlowMillions(cf.aumFeeIncome)}</td>
                          <td className="text-right p-1" style={{color: cf.aumFeeAccrued > 0 ? '#ff6b6b' : 'inherit'}}>
                            {cf.aumFeeAccrued > 0 ? formatCashFlowMillions(cf.aumFeeAccrued) : '-'}
                          </td>
                        </>
                      )}
                      {hdcSubDebtPct > 0 && pikCurrentPayEnabled && (
                        <td className="text-right p-1" style={{color: 'var(--hdc-cabbage-pont)'}}>
                          {cf.hdcSubDebtCurrentPay > 0 ? formatCashFlowMillions(cf.hdcSubDebtCurrentPay) : '-'}
                        </td>
                      )}
                      {hdcSubDebtPct > 0 && (
                        <>
                          <td className="text-right p-1" style={{color: 'var(--hdc-cabbage-pont)'}}>
                            {cf.hdcSubDebtPIKAccrued > 0 ? formatCashFlowMillions(cf.hdcSubDebtPIKAccrued) : '-'}
                          </td>
                          <td className="text-right p-1" style={{color: 'var(--hdc-cabbage-pont)'}}>
                            {cf.pikBalance > 0 ? formatCashFlowMillions(cf.pikBalance) : '-'}
                          </td>
                        </>
                      )}
                      <td className="text-right p-1" style={{color: (cf.promoteShare || 0) > 0 ? 'var(--hdc-brown-rust)' : 'inherit'}}>
                        {(cf.promoteShare || 0) > 0 ? formatCashFlowMillions(cf.promoteShare) : '-'}
                      </td>
                      <td className="text-right p-1 font-medium">{formatCashFlowMillions(cf.totalCashFlow)}</td>
                      <td className="text-right p-1" style={{color: 'var(--hdc-cabbage-pont)'}}>{formatCashFlowMillions(cf.cumulativeReturns)}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 font-semibold">
                    <td className="p-1">Exit</td>
                    <td className="text-right p-1">-</td>
                    <td className="text-right p-1">-</td>
                    {aumFeeEnabled && (
                      <>
                        <td className="text-right p-1">-</td>
                        <td className="text-right p-1">-</td>
                      </>
                    )}
                    {hdcSubDebtPct > 0 && pikCurrentPayEnabled && <td className="text-right p-1">-</td>}
                    {hdcSubDebtPct > 0 && (
                      <>
                        <td className="text-right p-1">-</td>
                        <td className="text-right p-1" style={{color: 'var(--hdc-cabbage-pont)'}}>{formatCashFlowMillions(hdcAnalysisResults.hdcSubDebtAtExit || 0)}</td>
                      </>
                    )}
                    <td className="text-right p-1" style={{color: 'var(--hdc-brown-rust)'}}>
                      {formatCashFlowMillions(hdcAnalysisResults.hdcPromoteProceeds || 0)}
                    </td>
                    <td className="text-right p-1">{formatCashFlowMillions(hdcExitProceeds)}</td>
                    <td className="text-right p-1" style={{color: 'var(--hdc-brown-rust)'}}>{formatCashFlowMillions(hdcTotalReturns)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              {aumFeeEnabled && <span style={{color: 'var(--hdc-cabbage-pont)'}} className="ml-2">• AUM fee: {aumFeeRate}% annually</span>}
              {aumFeeEnabled && (() => {
                const totalAccruedAUM = hdcCashFlows.reduce((sum, cf) => sum + (cf.aumFeeAccrued || 0), 0);
                if (totalAccruedAUM > 0) {
                  return (
                    <span style={{color: '#ff6b6b'}} className="ml-2">
                      • Total Deferred AUM: ${formatCashFlowMillions(totalAccruedAUM)}M (collected at exit)
                    </span>
                  );
                }
                return null;
              })()}
              {(() => {
                const totalDeferredTaxFees = hdcCashFlows.reduce((sum, cf) => sum + (cf.hdcFeeDeferred || 0), 0);
                if (totalDeferredTaxFees > 0) {
                  return (
                    <span style={{color: 'var(--hdc-strikemaster)'}} className="ml-2">
                      • Total Deferred Tax Benefit Fees: ${formatCashFlowMillions(totalDeferredTaxFees)}M (due to DSCR covenant)
                    </span>
                  );
                }
                return null;
              })()}
              {hdcSubDebtPct > 0 && !pikCurrentPayEnabled && <span style={{color: 'var(--hdc-cabbage-pont)'}} className="ml-2">• Full PIK accrual ({hdcSubDebtPikRate}%)</span>}
              {hdcSubDebtPct > 0 && pikCurrentPayEnabled && <span style={{color: 'var(--hdc-cabbage-pont)'}} className="ml-2">• Current pay: {pikCurrentPayPct}% of {hdcSubDebtPikRate}%</span>}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HDCCashFlowSection;