import React from 'react';
import type { InvestorAnalysisResults, HDCAnalysisResults } from '../../../types/taxbenefits';
import '../../../styles/taxbenefits/hdcCalculator.css';
import CollapsibleSection from './CollapsibleSection';

interface HDCPlatformSectionProps {
  hdcPlatformMode: 'traditional' | 'leverage' | undefined;

  // HDC Debt Fund (Outside Investor) Props
  outsideInvestorSubDebtPct: number;
  outsideInvestorSubDebtPikRate: number;
  outsideInvestorPikCurrentPayEnabled: boolean;
  outsideInvestorPikCurrentPayPct: number;
  projectCost: number;
  mainAnalysisResults: InvestorAnalysisResults;

  // HDC Sub-Debt Props (optional)
  hdcSubDebtPct?: number;
  hdcSubDebtPikRate?: number;

  // Philanthropic Debt Props (optional)
  philDebtPct?: number;
  philDebtRate?: number;

  // HDC Fee/Promote Props
  hdcAnalysisResults: HDCAnalysisResults;
  hdcTotalReturns: number;
  hdcMultiple: number;
  hdcIRR: number;

  // Cash flows for table
  investorCashFlows?: any[];

  formatCurrency: (value: number) => string;
  holdPeriod: number;
}

const HDCPlatformSection: React.FC<HDCPlatformSectionProps> = ({
  hdcPlatformMode,
  outsideInvestorSubDebtPct,
  outsideInvestorSubDebtPikRate,
  outsideInvestorPikCurrentPayEnabled,
  outsideInvestorPikCurrentPayPct,
  projectCost,
  mainAnalysisResults,
  hdcAnalysisResults,
  hdcTotalReturns,
  hdcMultiple,
  hdcIRR,
  investorCashFlows = [],
  formatCurrency,
  holdPeriod
}) => {
  // Only render in HDC Platform Mode when there's HDC DF debt
  if (hdcPlatformMode !== 'leverage' || outsideInvestorSubDebtPct === 0) {
    return null;
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Helper to format cash flow values (already in millions)
  const formatCashFlowMillions = (value: number) => {
    if (value === 0 || value === undefined || value === null) return '-';
    const absMillions = Math.abs(value);

    if (absMillions < 0.001 && absMillions > 0) return '0.00';

    const formatted = absMillions < 10
      ? absMillions.toFixed(3)
      : absMillions < 100
        ? absMillions.toFixed(2)
        : absMillions.toFixed(1);

    return value < 0 ? `(${formatted})` : formatted;
  };

  // HDC Debt Fund calculations
  const hdcDfPrincipal = projectCost * (outsideInvestorSubDebtPct / 100);
  const hdcDfTotalCost = mainAnalysisResults.outsideInvestorTotalCost || 0;
  const hdcDfTotalInterest = mainAnalysisResults.outsideInvestorTotalInterest || 0;
  const hdcDfCashPaid = mainAnalysisResults.outsideInvestorCashPaid || 0;
  const hdcDfPikAccrued = hdcDfTotalInterest - hdcDfCashPaid;

  // Platform combined returns
  const platformTotalInvestment = hdcDfPrincipal; // HDC only invests through debt fund
  const platformTotalReturns = hdcDfTotalInterest + hdcTotalReturns; // Interest income + fee/promote returns (not principal)
  const platformNetProfit = platformTotalReturns; // Pure profit (interest + fees)
  const platformTotalCashback = hdcDfPrincipal + platformTotalReturns; // Principal return + profits
  const platformMultiple = platformTotalInvestment > 0 ? (platformTotalCashback / platformTotalInvestment) : 0;

  // Calculate platform IRR (simplified - would need XIRR for accuracy)
  // IRR formula: (Total Cash Back / Investment)^(1/years) - 1
  const platformIRR = platformTotalInvestment > 0 && holdPeriod > 0
    ? (Math.pow(platformTotalCashback / platformTotalInvestment, 1 / holdPeriod) - 1) * 100
    : 0;

  return (
    <CollapsibleSection title="HDC Platform Combined Returns">
      <div>
        {/* Platform Overview */}
        <div style={{
          marginBottom: '1rem',
          padding: '0.75rem',
          borderRadius: '4px',
          border: '1px solid var(--hdc-faded-jade)'
        }}>
          <div style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--hdc-brown-rust)',
            marginBottom: '0.5rem'
          }}>
            HDC Platform Strategy Active
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: '#666',
            lineHeight: 1.5
          }}>
            HDC operates as both lender (HDC Debt Fund) and sponsor (fees + promote),
            capturing value across the entire capital stack with {formatCurrency(platformTotalInvestment)} invested.
          </div>
        </div>

        {/* HDC Debt Fund Returns */}
        <div style={{
          marginBottom: '0.75rem'
        }}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--hdc-faded-jade)',
            marginBottom: '0.25rem'
          }}>
            HDC Debt Fund (Gap Financing):
          </div>

          <div className="hdc-result-row" style={{ paddingLeft: '1rem' }}>
            <span className="hdc-result-label">Principal Invested:</span>
            <span className="hdc-result-value">{formatCurrency(hdcDfPrincipal)}</span>
          </div>

          <div className="hdc-result-row" style={{ paddingLeft: '1rem' }}>
            <span className="hdc-result-label">Interest Rate:</span>
            <span className="hdc-result-value">{formatPercent(outsideInvestorSubDebtPikRate)}</span>
          </div>

          <div className="hdc-result-row" style={{ paddingLeft: '1rem' }}>
            <span className="hdc-result-label">Total Interest Earned:</span>
            <span className="hdc-result-value hdc-value-positive">{formatCurrency(hdcDfTotalInterest)}</span>
          </div>

          <div className="hdc-result-row" style={{ paddingLeft: '1rem' }}>
            <span className="hdc-result-label">Principal Return:</span>
            <span className="hdc-result-value">
              {formatCurrency(hdcDfPrincipal)}
            </span>
          </div>

          <div className="hdc-result-row" style={{ paddingLeft: '1rem' }}>
            <span className="hdc-result-label">Total Debt Position Value:</span>
            <span className="hdc-result-value hdc-value-positive" style={{fontWeight: 600}}>
              {formatCurrency(hdcDfTotalCost)}
            </span>
          </div>

          {/* Blended Rate Display */}
          {hdcAnalysisResults.blendedDebtRate && hdcAnalysisResults.totalDebtAmount && (
            <div className="hdc-result-row" style={{
              paddingLeft: '1rem',
              marginTop: '0.5rem',
              paddingTop: '0.5rem',
              borderTop: '1px solid rgba(146, 195, 194, 0.2)'
            }}>
              <span className="hdc-result-label" style={{ fontWeight: 600 }}>Blended Debt Rate:</span>
              <span className="hdc-result-value" style={{fontWeight: 600, color: 'var(--hdc-brown-rust)'}}>
                {formatPercent(hdcAnalysisResults.blendedDebtRate)}
              </span>
            </div>
          )}
        </div>

        {/* HDC Fee/Promote Returns */}
        <div style={{
          borderTop: '1px solid rgba(146, 195, 194, 0.3)',
          paddingTop: '0.5rem',
          marginBottom: '0.75rem'
        }}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--hdc-faded-jade)',
            marginBottom: '0.25rem'
          }}>
            HDC Development & Management (No Equity Investment):
          </div>

          <div className="hdc-result-row" style={{ paddingLeft: '1rem' }}>
            <span className="hdc-result-label">HDC Fee (Year 1):</span>
            <span className="hdc-result-value hdc-value-positive">
              {formatCurrency(hdcAnalysisResults.hdcFeeIncome || 0)}
            </span>
          </div>

          <div className="hdc-result-row" style={{ paddingLeft: '1rem' }}>
            <span className="hdc-result-label">Tax Benefit Fees:</span>
            <span className="hdc-result-value hdc-value-positive">
              {formatCurrency(hdcAnalysisResults.hdcTaxBenefitFromFees || 0)}
            </span>
          </div>

          <div className="hdc-result-row" style={{ paddingLeft: '1rem' }}>
            <span className="hdc-result-label">AUM Fees:</span>
            <span className="hdc-result-value hdc-value-positive">
              {formatCurrency(hdcAnalysisResults.hdcAumFees || 0)}
            </span>
          </div>

          <div className="hdc-result-row" style={{ paddingLeft: '1rem' }}>
            <span className="hdc-result-label">Promote at Exit (65%):</span>
            <span className="hdc-result-value hdc-value-positive">
              {formatCurrency(hdcAnalysisResults.hdcPromoteShare || 0)}
            </span>
          </div>

          <div className="hdc-result-row" style={{ paddingLeft: '1rem' }}>
            <span className="hdc-result-label">Total Fee/Promote Income:</span>
            <span className="hdc-result-value hdc-value-positive" style={{fontWeight: 600}}>
              {formatCurrency(hdcTotalReturns)}
            </span>
          </div>
        </div>

        {/* Combined Platform Metrics */}
        <div style={{
          borderTop: '2px solid var(--hdc-brown-rust)',
          paddingTop: '0.75rem',
          marginTop: '0.75rem'
        }}>
          <div style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--hdc-brown-rust)',
            marginBottom: '0.5rem'
          }}>
            HDC Platform Combined Performance:
          </div>

          <div className="hdc-result-row summary">
            <span className="hdc-result-label" style={{fontWeight: 600}}>
              Total HDC Investment:
            </span>
            <span className="hdc-result-value" style={{fontWeight: 700}}>
              {formatCurrency(platformTotalInvestment)}
            </span>
          </div>

          <div className="hdc-result-row">
            <span className="hdc-result-label" style={{fontWeight: 600}}>
              Platform Net Profit:
            </span>
            <span className="hdc-result-value" style={{
              color: 'var(--hdc-cabbage-pont)',
              fontWeight: 700
            }}>
              {formatCurrency(platformNetProfit)}
            </span>
          </div>

          <div className="hdc-result-row summary">
            <span className="hdc-result-label" style={{fontWeight: 600}}>
              Total Cash Returned:
            </span>
            <span className="hdc-result-value" style={{
              color: 'var(--hdc-brown-rust)',
              fontWeight: 700
            }}>
              {formatCurrency(platformTotalCashback)}
            </span>
          </div>

          <div className="hdc-result-row">
            <span className="hdc-result-label" style={{fontWeight: 600}}>
              Platform Multiple:
            </span>
            <span className="hdc-result-value" style={{
              color: 'var(--hdc-brown-rust)',
              fontWeight: 700
            }}>
              {platformMultiple.toFixed(2)}x
            </span>
          </div>

          <div className="hdc-result-row">
            <span className="hdc-result-label" style={{fontWeight: 600}}>
              Platform IRR:
            </span>
            <span className="hdc-result-value" style={{
              color: 'var(--hdc-brown-rust)',
              fontWeight: 700
            }}>
              {formatPercent(platformIRR)}
            </span>
          </div>
        </div>

        {/* Strategy Note */}
        <div style={{
          marginTop: '1rem',
          padding: '0.5rem',
          borderRadius: '4px',
          fontSize: '0.7rem',
          fontStyle: 'italic'
        }}>
          <strong>Platform Strategy:</strong> HDC achieves {formatPercent(platformIRR)} IRR
          with only debt capital at risk. Fee and promote income (${(hdcTotalReturns/1000000).toFixed(1)}M)
          requires zero equity investment, creating infinite return on equity.
        </div>

        {/* HDC Platform Cash Flow Table */}
        {investorCashFlows && investorCashFlows.length > 0 && (
          <div className="p-3 bg-gray-50 rounded" style={{ marginTop: '1rem' }}>
            <h3 className="text-sm font-semibold mb-3">
              HDC Platform Annual Cash Flows
              <span className="text-xs text-gray-600 font-medium ml-2">($ in millions)</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-1">Year</th>
                    <th className="text-right p-1">HDC DF Interest</th>
                    <th className="text-right p-1">HDC DF PIK</th>
                    <th className="text-right p-1">Tax Fees</th>
                    <th className="text-right p-1">AUM Fees</th>
                    <th className="text-right p-1">Total Income</th>
                    <th className="text-right p-1">Cumulative</th>
                  </tr>
                </thead>
                <tbody>
                  {investorCashFlows.map((cf, index) => {
                    // Calculate HDC DF interest for this year
                    const hdcDfCurrentPay = cf.outsideInvestorCurrentPay || 0;
                    const hdcDfPikAccrued = (cf.outsideInvestorPIKAccrued || 0);

                    // HDC fees from cash flow
                    const hdcTaxFee = 0;
                    const aumFeePaid = cf.aumFeePaid || 0;

                    // Total HDC income for year
                    const totalIncome = hdcDfCurrentPay + hdcDfPikAccrued + hdcTaxFee + aumFeePaid;

                    // Calculate cumulative
                    const cumulativeIncome = investorCashFlows
                      .slice(0, index + 1)
                      .reduce((sum, flow) => {
                        const yearIncome = (flow.outsideInvestorCurrentPay || 0) +
                          (flow.outsideInvestorPIKAccrued || 0) +
                          (0) +
                          (flow.aumFeePaid || 0);
                        return sum + yearIncome;
                      }, 0);

                    return (
                      <tr key={cf.year} className="border-b">
                        <td className="p-1">{cf.year}</td>
                        <td className="text-right p-1">{formatCashFlowMillions(hdcDfCurrentPay)}</td>
                        <td className="text-right p-1" style={{color: 'var(--hdc-cabbage-pont)'}}>
                          {formatCashFlowMillions(hdcDfPikAccrued)}
                        </td>
                        <td className="text-right p-1">{formatCashFlowMillions(hdcTaxFee)}</td>
                        <td className="text-right p-1">{formatCashFlowMillions(aumFeePaid)}</td>
                        <td className="text-right p-1 font-medium">{formatCashFlowMillions(totalIncome)}</td>
                        <td className="text-right p-1" style={{color: 'var(--hdc-brown-rust)'}}>
                          {formatCashFlowMillions(cumulativeIncome)}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Exit row */}
                  <tr className="border-t-2 font-semibold">
                    <td className="p-1">Exit</td>
                    <td className="text-right p-1">-</td>
                    <td className="text-right p-1">{formatCashFlowMillions(hdcDfPrincipal)}</td>
                    <td className="text-right p-1">-</td>
                    <td className="text-right p-1">-</td>
                    <td className="text-right p-1">{formatCashFlowMillions(hdcAnalysisResults.hdcPromoteShare || 0)}</td>
                    <td className="text-right p-1" style={{color: 'var(--hdc-brown-rust)'}}>
                      {formatCashFlowMillions(platformTotalCashback)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              <div>• HDC DF earns {formatPercent(outsideInvestorSubDebtPikRate)} on ${(hdcDfPrincipal/1000000).toFixed(1)}M investment</div>
              <div>• Exit includes principal return + promote share</div>
              <div>• Total platform returns: {formatCurrency(platformNetProfit)} on {formatCurrency(platformTotalInvestment)} invested</div>
            </div>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
};

export default HDCPlatformSection;