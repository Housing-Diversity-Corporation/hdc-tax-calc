import React from 'react';
import '../../../styles/taxbenefits/hdcCalculator.css';
import CollapsibleSection from './CollapsibleSection';
import DistributableCashFlowChart from './DistributableCashFlowChart';

interface DistributableCashFlowTableProps {
  investorCashFlows: any[];
  holdPeriod: number;
  formatCurrency: (value: number) => string;
  aumFeeEnabled: boolean;
  aumFeeRate: number;
  constructionDelayMonths: number;
  hdcFeeRate: number;
  yearOneDepreciation: number;
  annualStraightLineDepreciation: number;
  effectiveTaxRate: number;
}

const DistributableCashFlowTable: React.FC<DistributableCashFlowTableProps> = ({
  investorCashFlows,
  holdPeriod,
  formatCurrency,
  aumFeeEnabled,
  aumFeeRate,
  constructionDelayMonths,
  hdcFeeRate,
  yearOneDepreciation,
  annualStraightLineDepreciation,
  effectiveTaxRate,
}) => {
  // Debug AUM fee data
  React.useEffect(() => {
    if (aumFeeEnabled && investorCashFlows.length > 0) {
      console.log('DistributableCashFlowTable - AUM Fee Debug:', {
        aumFeeEnabled,
        aumFeeRate,
        firstThreeYears: investorCashFlows.slice(0, 3).map(cf => ({
          year: cf.year,
          aumFeeAmount: cf.aumFeeAmount,
          aumFeePaid: cf.aumFeePaid,
          aumFeeAccrued: cf.aumFeeAccrued
        }))
      });
    }
  }, [aumFeeEnabled, aumFeeRate, investorCashFlows]);

  // Helper to format cash flow values (already in millions)
  const formatCashFlowMillions = (value: number, isPartial?: boolean) => {
    if (value === 0) return '-';
    // Values are already in millions, no need to divide
    const absMillions = Math.abs(value);

    if (absMillions < 0.001 && absMillions > 0) return '0.00';

    const formatted = absMillions < 10
      ? absMillions.toFixed(3)
      : absMillions < 100
        ? absMillions.toFixed(2)
        : absMillions.toFixed(1);

    return value < 0 ? `(${formatted})` : formatted;
  };

  // Helper to determine if a payment is partial
  const isPartialPayment = (paid: number, expected: number) => {
    return paid > 0 && paid < expected * 0.99; // Allow for small rounding differences
  };

  // Calculate when building is placed in service
  const placedInServiceYear = Math.floor(constructionDelayMonths / 12) + 1;

  // Check if there are any deferrals to determine if we should show deferral columns
  const hasTaxDeferrals = investorCashFlows.some(cf => (0) > 0);
  const hasAumDeferrals = investorCashFlows.some(cf => (cf.aumFeeAccrued || 0) > 0);

  return (
    <CollapsibleSection title="Distributable Cash Flow Analysis">
      <div className="p-3 bg-gray-50 rounded">
        {/* Waterfall Chart */}
        <DistributableCashFlowChart
          investorCashFlows={investorCashFlows}
          holdPeriod={holdPeriod}
          formatCurrency={formatCurrency}
          aumFeeEnabled={aumFeeEnabled}
          constructionDelayMonths={constructionDelayMonths}
        />

        <h3 className="text-sm font-semibold mb-3">
          Cash Flow Waterfall & DSCR Management
          <span className="text-xs text-gray-600 font-medium ml-2">($ in millions)</span>
          <span className="text-xs text-gray-600 font-medium ml-2">Shows progressive DSCR impact through payment waterfall</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              <th className="text-left p-1">Year</th>
              <th className="text-right p-1">Revenue</th>
              <th className="text-right p-1">OpEx</th>
              <th className="text-right p-1">NOI</th>
              <th className="text-right p-1">Hard Debt</th>
              <th className="text-right p-1">Free Cash</th>
              <th className="text-right p-1">Hard DSCR</th>
              <th className="text-right p-1" title="Sub-debt interest payments (Investor sub-debt is income)">Sub-Debt</th>
              <th className="text-right p-1">Cash After</th>
              <th className="text-right p-1">Sub DSCR</th>
              <th className="text-right p-1">Tax Fee</th>
              {hasTaxDeferrals && <th className="text-right p-1">Tax Def</th>}
              {aumFeeEnabled && (
                <>
                  <th className="text-right p-1">AUM Fee</th>
                  {hasAumDeferrals && <th className="text-right p-1">AUM Def</th>}
                </>
              )}
              <th className="text-right p-1">Final Cash</th>
              <th className="text-right p-1" style={{color: 'var(--hdc-cabbage-pont)'}}>Final DSCR</th>
              <th className="text-right p-1">Distributable</th>
            </tr>
          </thead>
          <tbody>
            {investorCashFlows.map((cf, index) => {
              const year = index + 1;
              const isConstruction = year < placedInServiceYear;
              const isDisposition = year === investorCashFlows.length; // IMPL-087

              // IMPL-020a: Use pre-calculated values from calculation engine
              // All waterfall calculations now come from CashFlowItem (single source of truth)
              const revenue = cf.revenue || 0;
              const opex = cf.opex || 0;
              const hardDebtService = cf.hardDebtService || 0;
              const freeCash = cf.freeCash || 0;
              const hardDscr = cf.hardDscr || 0;
              const totalSubDebtForDisplay = cf.totalSubDebtInterestGross || 0;
              const cashAfterSubDebt = cf.cashAfterSubDebt || 0;
              const subDebtDscr = cf.subDebtDscr || 0;

              // HDC fees (currently not charged, placeholders for future)
              const hdcTaxFeePaid = 0;
              const hdcTaxFeeDeferred = 0;
              const hdcTaxFeeExpected = hdcTaxFeePaid + hdcTaxFeeDeferred;
              const isPartialTaxFee = isPartialPayment(hdcTaxFeePaid, hdcTaxFeeExpected);

              // AUM fees
              const aumFeePaid = cf.aumFeePaid || 0;
              const aumFeeDeferred = cf.aumFeeAccrued || 0;
              const aumFeeExpected = cf.aumFeeAmount || 0;
              const isPartialAumFee = isPartialPayment(aumFeePaid, aumFeeExpected);

              // IMPL-020a: Use pre-calculated final cash from engine
              const finalCash = cf.finalCash || 0;

              // Final DSCR (should be exactly 1.05 when system is managing cash)
              const finalDscr = cf.targetDscr || 1.05;

              // Distributable to equity
              const distributableCash = cf.cashAfterDebtAndFees;

              return (
                <tr key={year} className="border-b">
                  <td className="p-1">{year}{isDisposition && <span style={{color: '#999', fontSize: '0.75em', marginLeft: '2px'}}>(exit)</span>}</td>
                  <td className="text-right p-1">
                    {isConstruction ? (
                      <span style={{color: '#999', fontSize: '0.85em'}}>construction</span>
                    ) : (
                      formatCashFlowMillions(revenue)
                    )}
                  </td>
                  <td className="text-right p-1">
                    {isConstruction ? '-' : formatCashFlowMillions(opex)}
                  </td>
                  <td className="text-right p-1 font-medium">
                    {formatCashFlowMillions(cf.noi)}
                  </td>
                  <td className="text-right p-1">
                    {formatCashFlowMillions(hardDebtService)}
                  </td>
                  <td className="text-right p-1">
                    {formatCashFlowMillions(freeCash)}
                  </td>
                  <td className="text-right p-1">
                    {hardDscr ? hardDscr.toFixed(2) + 'x' : '-'}
                  </td>
                  <td className="text-right p-1">
                    {totalSubDebtForDisplay > 0 ? formatCashFlowMillions(totalSubDebtForDisplay) : '-'}
                  </td>
                  <td className="text-right p-1">
                    {formatCashFlowMillions(cashAfterSubDebt)}
                  </td>
                  <td className="text-right p-1">
                    {subDebtDscr ? subDebtDscr.toFixed(2) + 'x' : '-'}
                  </td>
                  <td className="text-right p-1" style={{
                    color: hdcTaxFeePaid === 0 && hdcTaxFeeExpected > 0
                      ? '#dc3545'  // Red for fully deferred
                      : isPartialTaxFee
                        ? '#ff9800'  // Orange for partial payment
                        : undefined  // Normal color for full payment
                  }}>
                    {hdcTaxFeePaid > 0 ? formatCashFlowMillions(hdcTaxFeePaid) : (hdcTaxFeeExpected > 0 ? '0.00' : '-')}
                  </td>
                  {hasTaxDeferrals && (
                    <td className="text-right p-1" style={{color: '#dc3545'}}>
                      {hdcTaxFeeDeferred > 0 ? formatCashFlowMillions(hdcTaxFeeDeferred) : '-'}
                    </td>
                  )}
                  {aumFeeEnabled && (
                    <>
                      <td className="text-right p-1" style={{
                        color: aumFeePaid === 0 && aumFeeExpected > 0
                          ? '#dc3545'  // Red for fully deferred
                          : isPartialAumFee
                            ? '#ff9800'  // Orange for partial payment
                            : undefined  // Normal color for full payment
                      }}>
                        {aumFeePaid > 0 ? formatCashFlowMillions(aumFeePaid) : (aumFeeExpected > 0 ? '0.00' : '-')}
                      </td>
                      {hasAumDeferrals && (
                        <td className="text-right p-1" style={{color: '#dc3545'}}>
                          {aumFeeDeferred > 0 ? formatCashFlowMillions(aumFeeDeferred) : '-'}
                        </td>
                      )}
                    </>
                  )}
                  <td className="text-right p-1">
                    {formatCashFlowMillions(finalCash)}
                  </td>
                  <td className="text-right p-1" style={{color: 'var(--hdc-cabbage-pont)', fontWeight: 700}}>
                    {finalDscr.toFixed(2) + 'x'}
                  </td>
                  <td className="text-right p-1 font-medium">
                    {formatCashFlowMillions(distributableCash)}
                  </td>
                </tr>
              );
            })}

            {/* Summary Row */}
            <tr className="border-t font-semibold">
              <td className="p-1">Total</td>
              <td className="text-right p-1">-</td>
              <td className="text-right p-1">-</td>
              <td className="text-right p-1">
                {formatCashFlowMillions(
                  investorCashFlows.reduce((sum, cf) => sum + cf.noi, 0)
                )}
              </td>
              <td className="text-right p-1">
                {formatCashFlowMillions(
                  investorCashFlows.reduce((sum, cf) => {
                    return sum + (cf.hardDebtService || 0);
                  }, 0)
                )}
              </td>
              <td className="text-right p-1">-</td>
              <td className="text-right p-1">-</td>
              <td className="text-right p-1">
                {formatCashFlowMillions(
                  investorCashFlows.reduce((sum, cf) => {
                    // IMPL-020a: Use pre-calculated gross sub-debt from engine
                    return sum + (cf.totalSubDebtInterestGross || 0);
                  }, 0)
                )}
              </td>
              <td className="text-right p-1">-</td>
              <td className="text-right p-1">-</td>
              <td className="text-right p-1">
                {formatCashFlowMillions(
                  investorCashFlows.reduce((sum, cf) => sum + (0), 0)
                )}
              </td>
              {hasTaxDeferrals && (
                <td className="text-right p-1" style={{color: '#dc3545'}}>
                  {formatCashFlowMillions(
                    investorCashFlows.reduce((sum, cf) => sum + (0), 0)
                  )}
                </td>
              )}
              {aumFeeEnabled && (
                <>
                  <td className="text-right p-1">
                    {formatCashFlowMillions(
                      investorCashFlows.reduce((sum, cf) => sum + (cf.aumFeePaid || 0), 0)
                    )}
                  </td>
                  {hasAumDeferrals && (
                    <td className="text-right p-1" style={{color: '#dc3545'}}>
                      {formatCashFlowMillions(
                        investorCashFlows.reduce((sum, cf) => sum + (cf.aumFeeAccrued || 0), 0)
                      )}
                    </td>
                  )}
                </>
              )}
              <td className="text-right p-1">-</td>
              <td className="text-right p-1">-</td>
              <td className="text-right p-1 font-medium">
                {formatCashFlowMillions(
                  investorCashFlows.reduce((sum, cf) => sum + cf.cashAfterDebtAndFees, 0)
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      </div>
    </CollapsibleSection>
  );
};

export default DistributableCashFlowTable;