import React, { useState } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface DistributableCashFlowChartProps {
  investorCashFlows: any[];
  holdPeriod: number;
  formatCurrency: (value: number) => string;
  aumFeeEnabled: boolean;
  constructionDelayMonths: number;
}

interface WaterfallSegment {
  year: string;
  yearNum: number;
  // Waterfall segments - stacked to show cascade
  distributable: number; // Bottom segment (what's left)
  aumFees: number; // Stack on top of distributable
  taxFees: number; // Stack on top of AUM
  subDebt: number; // Stack on top of tax
  hardDebt: number; // Stack on top of sub-debt
  connector: number; // Invisible base to lift the waterfall
  // Original values for tooltip
  noiValue: number;
  hardDebtValue: number;
  subDebtValue: number;
  taxFeesPaidValue: number;
  taxFeesDeferredValue: number;
  taxFeesDeferredPlanned: number; // Always 0 (tax deferrals are always unplanned)
  taxFeesDeferredUnplanned: number; // All tax deferrals
  aumFeesPaidValue: number;
  aumFeesDeferredValue: number;
  aumFeesDeferredPlanned: number; // Intentional PIK structure
  aumFeesDeferredUnplanned: number; // DSCR-forced deferrals
  distributableValue: number;
  hardDscr: number;
  subDscr: number;
  finalDscr: number;
  hasDeficits: boolean;
  belowDscrThreshold: boolean;
  isConstruction: boolean;
  // Deferral details for tooltip
  deferralDetails?: {
    taxFeeDeferred?: number;
    aumFeeDeferred?: number;
    aumFeeIntended?: number;
    investorSubDebtPIK?: number;
    outsideInvestorPIK?: number;
    hdcSubDebtPIK?: number;
    operationalDSCR?: number;
  };
}

const DistributableCashFlowChart: React.FC<DistributableCashFlowChartProps> = ({
  investorCashFlows,
  holdPeriod,
  formatCurrency,
  aumFeeEnabled,
  constructionDelayMonths,
}) => {
  const [viewMode, setViewMode] = useState<'yearly' | 'aggregate'>('yearly');

  // Calculate when building is placed in service
  const placedInServiceYear = Math.floor(constructionDelayMonths / 12) + 1;

  // Check if there are any deferrals
  const hasTaxDeferrals = investorCashFlows.some(cf => (0) > 0);
  const hasAumDeferrals = investorCashFlows.some(cf => (cf.aumFeeAccrued || 0) > 0);
  const hasSubDebt = investorCashFlows.some(cf =>
    (cf.subDebtInterest || 0) > 0 ||
    (cf.outsideInvestorCurrentPay || 0) > 0 ||
    (cf.investorSubDebtInterestReceived || 0) > 0
  );

  // Transform data into waterfall structure
  // Waterfall shows: Start with NOI, stack down through deductions to distributable
  const waterfallData: WaterfallSegment[] = investorCashFlows.map((cf, index) => {
    const yearNum = index + 1;
    const isConstruction = yearNum < placedInServiceYear;

    // IMPL-020a: Use pre-calculated waterfall values from engine (single source of truth)
    const noiValue = cf.noi;
    const hardDebtService = cf.hardDebtService || 0;
    const hardDscr = cf.hardDscr || 0;

    // Sub-debt calculations - use pre-calculated values
    const totalSubDebtInterest = cf.totalSubDebtInterestNet || 0;
    const freeCashAfterHardDebt = cf.freeCash || 0;
    const cashAfterSubDebt = cf.cashAfterSubDebt || 0;
    const subDscr = cf.subDebtDscr || 0;

    // Fee calculations
    const taxFeePaid = 0;
    const taxFeeDeferred = 0;
    const totalTaxFees = taxFeePaid + taxFeeDeferred;

    const aumFeePaid = cf.aumFeePaid || 0;
    const aumFeeDeferred = cf.aumFeeAccrued || 0;
    const totalAumFees = aumFeePaid + aumFeeDeferred;

    const finalCash = cf.finalCash || 0;
    const finalDscr = cf.targetDscr || 1.05;
    const distributableValue = cf.cashAfterDebtAndFees;

    // Detect ALL UNPLANNED deferrals (cash management issues, not intentional accruals)

    // 1. Tax fee deferrals are ALWAYS unplanned (DSCR-forced)
    const hasUnplannedTaxDeferral = taxFeeDeferred > 0;

    // 2. AUM Fee: Only flag if we're NOT paying what we intended to pay
    const aumFeeAmount = cf.aumFeeAmount || 0;
    const hasUnplannedAumDeferral = aumFeeAmount > 0 && aumFeePaid < aumFeeAmount && aumFeeDeferred > 0;

    // 3. Sub-Debt Interest: Check if any sub-debt couldn't be paid
    // These are all "soft" payments that can be deferred by DSCR management
    const investorSubDebtPIK = cf.investorSubDebtPIKAccrued || 0;
    const outsideInvestorPIK = cf.outsideInvestorPIKAccrued || 0;
    const hdcSubDebtPIK = cf.hdcSubDebtPIKAccrued || 0;
    const hasSubDebtDeferrals = investorSubDebtPIK > 0 || outsideInvestorPIK > 0 || hdcSubDebtPIK > 0;

    // 4. Check if we're below the reserve threshold (operational DSCR issues)
    const hasOperationalStress = (cf.operationalDSCR || 0) < 1.05;

    // Combined: Any unplanned deferral or operational stress
    const hasDeficits = hasUnplannedTaxDeferral || hasUnplannedAumDeferral || hasSubDebtDeferrals || hasOperationalStress;
    const belowDscrThreshold = hardDscr < 1.05 || subDscr < 1.05;

    // Calculate planned vs unplanned deferrals
    // Tax: ALL deferrals are unplanned (DSCR-forced)
    const taxFeesDeferredPlanned = 0;
    const taxFeesDeferredUnplanned = taxFeeDeferred;

    // AUM: Split between planned (intentional PIK) and unplanned (DSCR-forced)
    // If aumFeeAmount is 0, then ALL deferrals are planned (100% PIK structure)
    // If aumFeeAmount > 0, then deferrals are unplanned (couldn't pay what was intended)
    const aumFeesDeferredPlanned = aumFeeAmount === 0 ? aumFeeDeferred : 0;
    const aumFeesDeferredUnplanned = aumFeeAmount > 0 ? aumFeeDeferred : 0;

    // Collect deferral details for tooltip
    const deferralDetails = hasDeficits ? {
      taxFeeDeferred: hasUnplannedTaxDeferral ? taxFeeDeferred : undefined,
      aumFeeDeferred: hasUnplannedAumDeferral ? aumFeeDeferred : undefined,
      aumFeeIntended: hasUnplannedAumDeferral ? aumFeeAmount : undefined,
      investorSubDebtPIK: investorSubDebtPIK > 0 ? investorSubDebtPIK : undefined,
      outsideInvestorPIK: outsideInvestorPIK > 0 ? outsideInvestorPIK : undefined,
      hdcSubDebtPIK: hdcSubDebtPIK > 0 ? hdcSubDebtPIK : undefined,
      operationalDSCR: hasOperationalStress ? cf.operationalDSCR : undefined,
    } : undefined;

    // For waterfall stacking: build from bottom to top
    // Bottom = distributable, then stack each deduction on top
    return {
      year: `Y${yearNum}`,
      yearNum,
      connector: 0, // Start at zero
      distributable: distributableValue,
      aumFees: totalAumFees,
      taxFees: totalTaxFees,
      subDebt: totalSubDebtInterest,
      hardDebt: hardDebtService,
      // Original values for tooltip
      noiValue,
      hardDebtValue: hardDebtService,
      subDebtValue: totalSubDebtInterest,
      taxFeesPaidValue: taxFeePaid,
      taxFeesDeferredValue: taxFeeDeferred,
      taxFeesDeferredPlanned,
      taxFeesDeferredUnplanned,
      aumFeesPaidValue: aumFeePaid,
      aumFeesDeferredValue: aumFeeDeferred,
      aumFeesDeferredPlanned,
      aumFeesDeferredUnplanned,
      distributableValue,
      hardDscr,
      subDscr,
      finalDscr,
      hasDeficits,
      belowDscrThreshold,
      isConstruction,
      deferralDetails,
    };
  });

  // Aggregate data (sum all years)
  const aggregateData: WaterfallSegment[] = [{
    year: 'Total',
    yearNum: 0,
    connector: 0,
    distributable: waterfallData.reduce((sum, d) => sum + d.distributable, 0),
    aumFees: waterfallData.reduce((sum, d) => sum + d.aumFees, 0),
    taxFees: waterfallData.reduce((sum, d) => sum + d.taxFees, 0),
    subDebt: waterfallData.reduce((sum, d) => sum + d.subDebt, 0),
    hardDebt: waterfallData.reduce((sum, d) => sum + d.hardDebt, 0),
    noiValue: waterfallData.reduce((sum, d) => sum + d.noiValue, 0),
    hardDebtValue: waterfallData.reduce((sum, d) => sum + d.hardDebtValue, 0),
    subDebtValue: waterfallData.reduce((sum, d) => sum + d.subDebtValue, 0),
    taxFeesPaidValue: waterfallData.reduce((sum, d) => sum + d.taxFeesPaidValue, 0),
    taxFeesDeferredValue: waterfallData.reduce((sum, d) => sum + d.taxFeesDeferredValue, 0),
    taxFeesDeferredPlanned: waterfallData.reduce((sum, d) => sum + d.taxFeesDeferredPlanned, 0),
    taxFeesDeferredUnplanned: waterfallData.reduce((sum, d) => sum + d.taxFeesDeferredUnplanned, 0),
    aumFeesPaidValue: waterfallData.reduce((sum, d) => sum + d.aumFeesPaidValue, 0),
    aumFeesDeferredValue: waterfallData.reduce((sum, d) => sum + d.aumFeesDeferredValue, 0),
    aumFeesDeferredPlanned: waterfallData.reduce((sum, d) => sum + d.aumFeesDeferredPlanned, 0),
    aumFeesDeferredUnplanned: waterfallData.reduce((sum, d) => sum + d.aumFeesDeferredUnplanned, 0),
    distributableValue: waterfallData.reduce((sum, d) => sum + d.distributableValue, 0),
    hardDscr: 0,
    subDscr: 0,
    finalDscr: 0,
    hasDeficits: waterfallData.some(d => d.hasDeficits),
    belowDscrThreshold: false,
    isConstruction: false,
  }];

  const chartData = viewMode === 'yearly' ? waterfallData : aggregateData;

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as WaterfallSegment;

      return (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '12px',
          fontSize: '11px',
        }}>
          <div style={{ fontWeight: 600, marginBottom: '8px', color: '#407F7F' }}>
            {label}
          </div>

          {data.isConstruction && (
            <div style={{ color: '#999', fontStyle: 'italic', marginBottom: '8px' }}>
              Construction Year
            </div>
          )}

          <div style={{ marginBottom: '4px' }}>
            <strong>NOI:</strong> {formatCurrency(data.noiValue)}
          </div>

          <div style={{ marginBottom: '4px', color: '#BF7041' }}>
            <strong>- Hard Debt:</strong> {formatCurrency(data.hardDebtValue)}
          </div>

          {viewMode === 'yearly' && data.hardDscr > 0 && (
            <div style={{
              marginLeft: '8px',
              fontSize: '10px',
              color: data.hardDscr < 1.05 ? '#dc3545' : '#666'
            }}>
              Hard DSCR: {data.hardDscr.toFixed(2)}x
            </div>
          )}

          {hasSubDebt && data.subDebtValue > 0 && (
            <>
              <div style={{ marginBottom: '4px', color: '#43778A' }}>
                <strong>- Sub-Debt:</strong> {formatCurrency(data.subDebtValue)}
              </div>
              {viewMode === 'yearly' && data.subDscr > 0 && (
                <div style={{
                  marginLeft: '8px',
                  fontSize: '10px',
                  color: data.subDscr < 1.05 ? '#dc3545' : '#666'
                }}>
                  Sub DSCR: {data.subDscr.toFixed(2)}x
                </div>
              )}
            </>
          )}

          <div style={{ marginBottom: '4px', color: data.taxFeesDeferredValue > 0 ? '#dc3545' : '#BFB05E' }}>
            <strong>- Tax Fees:</strong> {formatCurrency(data.taxFeesPaidValue + data.taxFeesDeferredValue)}
            {data.taxFeesDeferredValue > 0 && (
              <span style={{ marginLeft: '4px', fontSize: '10px', color: '#dc3545' }}>
                ({formatCurrency(data.taxFeesDeferredValue)} deferred)
              </span>
            )}
          </div>

          {aumFeeEnabled && (data.aumFeesPaidValue > 0 || data.aumFeesDeferredValue > 0) && (
            <div style={{ marginBottom: '4px', color: data.aumFeesDeferredValue > 0 ? '#dc3545' : '#54BFBF' }}>
              <strong>- AUM Fees:</strong> {formatCurrency(data.aumFeesPaidValue + data.aumFeesDeferredValue)}
              {data.aumFeesDeferredValue > 0 && (
                <span style={{ marginLeft: '4px', fontSize: '10px', color: '#dc3545' }}>
                  ({formatCurrency(data.aumFeesDeferredValue)} deferred)
                </span>
              )}
            </div>
          )}

          <div style={{
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid #e0e0e0',
            fontWeight: 600,
            color: '#7FBD45'
          }}>
            <strong>= Distributable:</strong> {formatCurrency(data.distributableValue)}
          </div>

          {viewMode === 'yearly' && (
            <div style={{
              marginTop: '4px',
              fontSize: '10px',
              color: '#407F7F'
            }}>
              Final DSCR: {data.finalDscr.toFixed(2)}x
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Format Y-axis
  // ISS-067: Standardized to 2 decimals for consistency with formatAbbreviatedCurrency
  const formatYAxis = (value: number) => {
    const valueInDollars = value * 1000000;
    const absValue = Math.abs(valueInDollars);
    if (absValue >= 1000000) {
      return `$${(valueInDollars / 1000000).toFixed(2)}M`;
    } else if (absValue >= 1000) {
      return `$${(valueInDollars / 1000).toFixed(0)}K`;
    } else {
      return `$${valueInDollars.toFixed(0)}`;
    }
  };

  return (
    <div style={{ width: '100%', marginBottom: '2rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h3 style={{
          fontSize: '0.95rem',
          fontWeight: 600,
          color: '#407F7F',
          margin: 0
        }}>
          Cash Flow Waterfall Visualization
        </h3>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setViewMode('yearly')}
            className="!px-1.5 !py-1 sm:!px-3 md:!px-4 text-[10px] sm:text-xs md:text-sm border rounded"
            style={{
              border: '1px solid #407F7F',
              backgroundColor: viewMode === 'yearly' ? '#407F7F' : 'transparent',
              color: viewMode === 'yearly' ? 'white' : '#407F7F',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Year-by-Year
          </button>
          <button
            onClick={() => setViewMode('aggregate')}
            className="!px-1.5 !py-1 sm:!px-3 md:!px-4 text-[10px] sm:text-xs md:text-sm border rounded"
            style={{
              border: '1px solid #407F7F',
              backgroundColor: viewMode === 'aggregate' ? '#407F7F' : 'transparent',
              color: viewMode === 'aggregate' ? 'white' : '#407F7F',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Total
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300} className="sm:h-[400px]">
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 40, left: 15, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />

          <XAxis
            dataKey="year"
            tick={{ fontSize: 10 }}
            angle={viewMode === 'yearly' ? 0 : -45}
            textAnchor={viewMode === 'yearly' ? 'middle' : 'end'}
            height={60}
          />

          <YAxis
            yAxisId="left"
            tickFormatter={formatYAxis}
            tick={{ fontSize: 9 }}
            width={70}
            label={{
              value: 'Payments ($ Millions)',
              angle: -90,
              position: 'insideLeft',
              offset: 10,
              style: { fontSize: 9, textAnchor: 'middle' }
            }}
          />

          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={formatYAxis}
            tick={{ fontSize: 9 }}
            width={70}
            label={{
              value: 'Hard Debt ($ Millions)',
              angle: 90,
              position: 'insideRight',
              offset: 10,
              style: { fontSize: 9, textAnchor: 'middle' }
            }}
          />

          {/* Reference line at zero */}
          <ReferenceLine y={0} stroke="#666" strokeWidth={1} />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
            iconSize={10}
          />

          {/* Stacked waterfall bars - build from bottom to top */}
          {/* Left Y-axis: Distributable only (standalone, not stacked) */}
          <Bar yAxisId="left" dataKey="distributable" name="Distributable" fill="#7FBD45" />

          {/* Right Y-axis: Hard Debt, Sub-Debt, Fees (stacked together) */}
          <Bar yAxisId="right" dataKey="hardDebt" stackId="payments" name="Hard Debt" fill="#BF7041" opacity={0.7} />

          {hasSubDebt && (
            <Bar yAxisId="right" dataKey="subDebt" stackId="payments" name="Sub-Debt" fill="#43778A" />
          )}

          <Bar yAxisId="right" dataKey="taxFees" stackId="payments" name="Tax Fees" fill="#BFB05E" />

          {aumFeeEnabled && (
            <Bar yAxisId="right" dataKey="aumFees" stackId="payments" name="AUM Fees" fill="#54BFBF" />
          )}

          {/* NOI line on right axis to match hard debt scale */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="noiValue"
            name="NOI"
            stroke="#407F7F"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#407F7F', r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Status indicators */}
      {viewMode === 'yearly' && (
        <div className="flex flex-nowrap justify-start lg:justify-center gap-1.5 sm:gap-2 lg:gap-3 mt-3 text-xs overflow-x-auto pb-2 scrollbar-thin"
          style={{
            maxWidth: '100%',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {waterfallData.map((d, i) => {
            // Build tooltip details for deferrals
            const hasDetails = d.hasDeficits && d.deferralDetails;
            const details: React.ReactElement[] = [];

            if (hasDetails) {
              if (d.deferralDetails!.taxFeeDeferred) {
                details.push(
                  <div key="tax">Tax Fee Deferred: {formatCurrency(d.deferralDetails!.taxFeeDeferred)}</div>
                );
              }

              if (d.deferralDetails!.aumFeeDeferred && d.deferralDetails!.aumFeeIntended) {
                const paid = d.deferralDetails!.aumFeeIntended - d.deferralDetails!.aumFeeDeferred;
                details.push(
                  <div key="aum">
                    AUM Fee Shortfall: {formatCurrency(d.deferralDetails!.aumFeeDeferred)}
                    <div style={{ fontSize: '9px', color: '#888', marginLeft: '8px' }}>
                      (intended {formatCurrency(d.deferralDetails!.aumFeeIntended)}, paid {formatCurrency(paid)})
                    </div>
                  </div>
                );
              }

              if (d.deferralDetails!.investorSubDebtPIK) {
                details.push(
                  <div key="investor">Investor Sub-Debt PIK: {formatCurrency(d.deferralDetails!.investorSubDebtPIK)}</div>
                );
              }

              if (d.deferralDetails!.outsideInvestorPIK) {
                details.push(
                  <div key="outside">Outside Investor PIK: {formatCurrency(d.deferralDetails!.outsideInvestorPIK)}</div>
                );
              }

              if (d.deferralDetails!.hdcSubDebtPIK) {
                details.push(
                  <div key="hdc">HDC Sub-Debt PIK: {formatCurrency(d.deferralDetails!.hdcSubDebtPIK)}</div>
                );
              }

              if (d.deferralDetails!.operationalDSCR !== undefined) {
                details.push(
                  <div key="dscr">Operational DSCR: {d.deferralDetails!.operationalDSCR.toFixed(2)}x (below 1.05x threshold)</div>
                );
              }
            }

            return (
              <div
                key={i}
                className="flex flex-col items-center min-w-[28px] sm:min-w-[36px] lg:min-w-[40px] relative flex-shrink-0"
              >
                <span className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs lg:text-sm font-medium">{d.year}</span>
                <span
                  className="text-xs sm:text-sm lg:text-base status-indicator"
                  style={{
                    color: d.hasDeficits ? '#dc3545' : d.belowDscrThreshold ? '#ff9800' : '#7FBD45',
                    cursor: d.hasDeficits ? 'help' : 'default'
                  }}
                >
                  {d.hasDeficits ? '⚠' : d.belowDscrThreshold ? '⚡' : '✓'}
                  {/* Tooltip on hover */}
                  {hasDetails && details.length > 0 && (
                    <div
                      className="deferral-tooltip"
                      style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        marginBottom: '8px',
                        backgroundColor: '#333',
                        color: '#fff',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        whiteSpace: 'nowrap',
                        zIndex: 1000,
                        opacity: 0,
                        pointerEvents: 'none',
                        transition: 'opacity 0.2s',
                        minWidth: '250px',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Payment Deferrals:</div>
                      {details}
                      {/* Arrow */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 0,
                          height: 0,
                          borderLeft: '6px solid transparent',
                          borderRight: '6px solid transparent',
                          borderTop: '6px solid #333'
                        }}
                      />
                    </div>
                  )}
                </span>
                <span style={{ fontSize: '9px', color: '#666' }}>
                  {d.finalDscr.toFixed(2)}x
                </span>
                <style>{`
                  .status-indicator:hover .deferral-tooltip {
                    opacity: 1;
                  }
                `}</style>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend for status indicators */}
      <div style={{
        marginTop: '12px',
        padding: '8px',
        backgroundColor: '#f9fafb',
        borderRadius: '4px',
        fontSize: '10px',
        color: '#666'
      }}>
        <div style={{ marginBottom: '4px' }}>
          <strong>Waterfall Flow:</strong> NOI (dotted line) → Hard Debt → Sub-Debt → Tax Fees → AUM Fees → Distributable (green)
        </div>
        <div style={{ marginBottom: '4px', fontStyle: 'italic', color: '#888' }}>
          <strong>Dual Y-Axis:</strong> Left axis shows distributable cash. Right axis shows stacked payments (hard debt, sub-debt, fees) and NOI line.
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '6px' }}>
          <span>✓ = Healthy cash flow</span>
          <span>⚡ = Below 1.05x DSCR</span>
          <span>⚠ = Payment deferrals</span>
        </div>
      </div>

      {/* Deferred Fees Chart - Only show if there are deferrals */}
      {(hasTaxDeferrals || hasAumDeferrals) && (
        <div style={{ marginTop: '2rem' }}>
          <h4 style={{
            fontSize: '0.9rem',
            fontWeight: 600,
            color: '#407F7F',
            marginBottom: '1rem'
          }}>
            Deferred Fee Tracking
          </h4>

          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 40, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />

              <XAxis
                dataKey="year"
                tick={{ fontSize: 10 }}
                angle={viewMode === 'yearly' ? 0 : -45}
                textAnchor={viewMode === 'yearly' ? 'middle' : 'end'}
                height={50}
              />

              <YAxis
                tickFormatter={formatYAxis}
                tick={{ fontSize: 10 }}
                width={60}
                label={{
                  value: '$ Millions',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 11 }
                }}
              />

              <Tooltip
                formatter={(value: number | undefined) => formatCurrency((value ?? 0) * 1000000)}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '11px'
                }}
              />

              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                iconSize={10}
              />

              {/* Annual deferrals - split by planned vs unplanned */}
              {/* UNPLANNED deferrals (DSCR-forced) - shown with darker, more solid colors */}
              {hasTaxDeferrals && (
                <Bar
                  dataKey="taxFeesDeferredUnplanned"
                  name="Tax Fee - Unplanned"
                  stackId="deferrals"
                  fill="#BFB05E"
                />
              )}

              {hasAumDeferrals && (
                <Bar
                  dataKey="aumFeesDeferredUnplanned"
                  name="AUM Fee - Unplanned"
                  stackId="deferrals"
                  fill="#407F7F"
                />
              )}

              {/* PLANNED deferrals (intentional PIK) - shown with lighter green */}
              {hasAumDeferrals && (
                <Bar
                  dataKey="aumFeesDeferredPlanned"
                  name="AUM Fee - Planned"
                  stackId="deferrals"
                  fill="#7FBD45"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>

          <div style={{
            marginTop: '12px',
            padding: '8px',
            backgroundColor: '#f9fafb',
            borderRadius: '4px',
            fontSize: '10px',
            color: '#666',
            borderLeft: '3px solid #BFB05E'
          }}>
            <div style={{ marginBottom: '4px' }}>
              <strong>Understanding Deferrals:</strong>
            </div>
            <div style={{ marginBottom: '4px' }}>
              • <strong>Unplanned deferrals</strong> (solid bars): DSCR-forced deferrals due to cash management rules - indicates cash flow stress
            </div>
            <div style={{ marginBottom: '4px' }}>
              • <strong>Planned deferrals</strong> (light bars): Intentional PIK structure (e.g., 0% current pay) - part of capital structure design
            </div>
            <div>
              • All deferred amounts compound and are collected at exit from the investor's share of proceeds
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DistributableCashFlowChart;
