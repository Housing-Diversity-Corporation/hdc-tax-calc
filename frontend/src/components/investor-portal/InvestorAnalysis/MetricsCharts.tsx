import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
} from 'recharts';
import { formatCurrencyMillions } from '../../../utils/taxbenefits/formatters';
import type { CashFlowItem } from '../../../types/taxbenefits';

interface MetricsChartsProps {
  investorEquity: number;
  totalReturns: number;
  multipleOnInvested: number;
  investorIRR: number;
  investorCashFlows?: CashFlowItem[];
  exitProceeds: number;
  totalTaxBenefit?: number;
  year1TaxBenefit?: number;

  // New props for additional charts
  hdcCashFlows?: any[];
  hdcTotalReturns?: number;
  hdcExitProceeds?: number;
  mainAnalysisResults?: any;
  hdcAnalysisResults?: any;
}

const MetricsCharts: React.FC<MetricsChartsProps> = ({
  investorEquity,
  totalReturns,
  multipleOnInvested,
  investorIRR,
  investorCashFlows = [],
  exitProceeds,
  totalTaxBenefit = 0,
  year1TaxBenefit = 0,
  hdcCashFlows = [],
  hdcTotalReturns = 0,
  hdcExitProceeds = 0,
  mainAnalysisResults,
  hdcAnalysisResults,
}) => {
  // Data for Investment vs Returns bar chart (HDC colors)
  const investmentReturnsData = [
    { name: 'Investment', value: investorEquity, fill: '#BF7041' }, // hdc-brown-rust
    { name: 'Total Returns', value: totalReturns, fill: '#407F7F' }, // hdc-faded-jade
  ];

  // Data for cash flow timeline - properly mapped from CashFlowItem
  const cashFlowData = investorCashFlows.map((flow, index) => {
    const year = flow.year || index + 1;
    const isLastYear = index === investorCashFlows.length - 1;

    return {
      year: `Y${year}`,
      operatingCashFlow: flow.operatingCashFlow || 0,
      taxBenefit: flow.taxBenefit || 0,
      subDebtInterest: flow.investorSubDebtInterestReceived || flow.subDebtInterest || 0,
      totalCashFlow: flow.totalCashFlow || 0,
      exitProceeds: isLastYear ? exitProceeds : 0,
      cumulative: flow.cumulativeReturns || 0,
    };
  });

  // Tax Planning Capacity - Calculate allocation breakdown
  const totalNetTaxBenefits = investorCashFlows.reduce((sum, flow) => sum + (flow.taxBenefit || 0), 0);
  const totalHdcFees = investorCashFlows.reduce((sum, flow) => sum + (0), 0);
  const year1NetBenefit = investorCashFlows[0]?.taxBenefit || 0;
  const year5OZTaxDue = investorCashFlows[4]?.ozYear5TaxPayment || 0;

  // Calculate allocation (preserve signs - negative values are informative)
  const usedForEquityRecovery = Math.min(year1NetBenefit, investorEquity);
  const afterRecovery = totalNetTaxBenefits - usedForEquityRecovery - year5OZTaxDue;

  const taxAllocationData: Array<{
    category: string;
    amount: number;
    fill: string;
  }> = [
    {
      category: 'Total Net Tax Benefits',
      amount: totalNetTaxBenefits,
      fill: '#407F7F', // hdc-faded-jade
    },
    {
      category: 'Used for Equity Recovery',
      amount: usedForEquityRecovery,
      fill: '#BF7041', // hdc-brown-rust
    },
    ...(year5OZTaxDue > 0 ? [{
      category: 'Year 5 OZ Tax Payment',
      amount: year5OZTaxDue,
      fill: '#474A44', // hdc-cabbage-pont
    }] : []),
    {
      category: 'Available for Tax Planning',
      amount: afterRecovery,
      fill: '#92C3C2', // keeping this lighter accent
    },
  ];

  // HDC Cash Flow Timeline
  const hdcCashFlowData = hdcCashFlows.map((flow, index) => {
    const year = flow.year || index + 1;
    const isLastYear = index === hdcCashFlows.length - 1;

    return {
      year: `Y${year}`,
      operatingCashFlow: flow.operatingCashFlow || 0,
      aumFeeIncome: flow.aumFeeIncome || 0,
      taxBenefitFee: 0,
      philanthropicShare: flow.philanthropicShare || 0,
      promoteShare: flow.promoteShare || 0,
      totalCashFlow: flow.totalCashFlow || 0,
      exitProceeds: isLastYear ? hdcExitProceeds : 0,
      cumulative: flow.cumulativeReturns || 0,
    };
  });

  // Depreciation Schedule (preserve signs - negative values are informative)
  const depreciationData = mainAnalysisResults?.depreciationSchedule?.schedule?.map((item: any) => ({
    year: `Y${item.year}`,
    costSegregation: item.costSegregation || 0,
    bonusDepreciation: item.bonusDepreciation || 0,
    straightLineDepreciation: item.straightLineDepreciation || 0,
    totalDepreciation: item.totalDepreciation || 0,
    totalTaxBenefit: item.totalTaxBenefit || 0,
    netBenefit: item.netBenefit || 0,
    cumulativeDepreciation: item.cumulativeDepreciation || 0,
  })) || [];

  // Investor vs HDC Returns Comparison - Breakdown by constituent parts
  // Calculate Investor breakdown (exclude exit year from annual totals)
  const investorAnnualFlows = investorCashFlows.slice(0, -1); // All years except exit
  const investorTotalTaxBenefits = investorAnnualFlows.reduce((sum, flow) => sum + (flow.taxBenefit || 0), 0);
  const investorTotalOperatingCashFlow = investorAnnualFlows.reduce((sum, flow) => sum + (flow.operatingCashFlow || 0), 0);
  const investorTotalSubDebtInterest = investorAnnualFlows.reduce((sum, flow) => sum + (flow.investorSubDebtInterestReceived || flow.subDebtInterest || 0), 0);

  // Calculate HDC breakdown (exclude exit year from annual totals)
  const hdcAnnualFlows = hdcCashFlows.slice(0, -1); // All years except exit
  const hdcTotalTaxBenefitFees = hdcAnnualFlows.reduce((sum, flow) => sum + (0), 0);
  const hdcTotalAumFees = hdcAnnualFlows.reduce((sum, flow) => sum + (flow.aumFeeIncome || 0), 0);
  const hdcTotalPromoteShare = hdcAnnualFlows.reduce((sum, flow) => sum + (flow.promoteShare || 0), 0);

  const returnsComparisonData = [
    {
      name: 'Investor',
      taxBenefits: investorTotalTaxBenefits,
      operatingCashFlow: investorTotalOperatingCashFlow,
      subDebtInterest: investorTotalSubDebtInterest,
      exitProceeds: exitProceeds,
    },
    {
      name: 'HDC',
      aumFees: hdcTotalAumFees,
      promoteShare: hdcTotalPromoteShare,
      exitProceeds: hdcExitProceeds,
    },
  ];

  // DSCR Analysis
  const dscrData = investorCashFlows.map((flow, index) => ({
    year: `Y${flow.year || index + 1}`,
    operationalDSCR: flow.operationalDSCR || 0,
    finalDSCR: flow.dscr || 0,
    targetDSCR: flow.targetDscr || 1.05,
  }));

  // Custom tooltip for currency formatting
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded border border-gray-300 bg-white p-2">
          <p className="text-sm font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrencyMillions(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mt-6 flex flex-col gap-6">
      {/* Key Metrics Summary - MOVED TO TOP */}
      <div className="rounded-xl bg-white p-4 shadow-md">
        <h6 className="mb-4 text-base font-medium" style={{ color: '#407F7F' }}>
          Key Performance Indicators
        </h6>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          <div className="rounded bg-gray-100 p-4 text-center">
            <p className="text-sm text-gray-500">Total Investment</p>
            <p className="text-xl font-semibold" style={{ color: '#BF7041' }}>
              {formatCurrencyMillions(investorEquity)}
            </p>
          </div>
          <div className="rounded bg-gray-100 p-4 text-center">
            <p className="text-sm text-gray-500">Total Returns</p>
            <p className="text-xl font-semibold" style={{ color: '#407F7F' }}>
              {formatCurrencyMillions(totalReturns)}
            </p>
          </div>
          <div className="rounded bg-gray-100 p-4 text-center">
            <p className="text-sm text-gray-500">Multiple on Investment</p>
            <p className="text-xl font-semibold" style={{ color: '#407F7F' }}>
              {multipleOnInvested.toFixed(2)}x
            </p>
          </div>
          <div className="rounded bg-gray-100 p-4 text-center">
            <p className="text-sm text-gray-500">IRR</p>
            <p className="text-xl font-semibold" style={{ color: '#407F7F' }}>
              {investorIRR.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Investment vs Returns Bar Chart */}
        <div className="rounded-xl bg-white p-4 shadow-md">
          <h6 className="mb-4 text-base font-medium" style={{ color: '#407F7F' }}>
            Investment vs Total Returns
          </h6>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={investmentReturnsData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={60} />
              <YAxis
                tickFormatter={(value) => formatCurrencyMillions(value)}
                width={80}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#276221">
                {investmentReturnsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 flex flex-col items-center">
            <p className="text-sm text-gray-500">
              Return Multiple: <strong>{multipleOnInvested.toFixed(2)}x</strong>
            </p>
            <p className="text-sm text-gray-500">
              Net Profit: <strong>{formatCurrencyMillions(totalReturns - investorEquity)}</strong>
            </p>
          </div>
        </div>

        {/* Tax Benefit Allocation Chart - REDESIGNED */}
        <div className="rounded-xl bg-white p-4 shadow-md">
          <h6 className="mb-4 text-base font-medium" style={{ color: '#407F7F' }}>
            Tax Benefit Allocation
          </h6>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={taxAllocationData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="category"
                tick={{ fontSize: 11 }}
                angle={-15}
                textAnchor="end"
                height={60}
                interval={0}
              />
              <YAxis
                tickFormatter={(value) => formatCurrencyMillions(value)}
                width={80}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" name="Amount">
                {taxAllocationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 flex flex-col items-center gap-1">
            <p className="text-[0.85rem] text-gray-500">
              <strong>Available Capacity:</strong> {formatCurrencyMillions(afterRecovery)}
            </p>
            <p className="max-w-[90%] text-center text-xs text-gray-400">
              {afterRecovery >= 0
                ? 'This capacity can be used for 1031 exchanges, Roth conversions, or depreciation offsets'
                : 'Negative capacity indicates tax obligations exceed benefits in this scenario'}
            </p>
          </div>
        </div>
      </div>

      {/* Cash Flow Timeline - Updated mapping with Dual Y-Axes */}
      <div className="rounded-xl bg-white p-4 shadow-md">
        <h6 className="mb-4 text-base font-medium" style={{ color: '#407F7F' }}>
          Investor Cash Flow Timeline
        </h6>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={cashFlowData} margin={{ top: 5, right: 60, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            {/* Left Y-axis for annual cash flows */}
            <YAxis
              yAxisId="left"
              orientation="left"
              tickFormatter={(value) => formatCurrencyMillions(value)}
              width={80}
              tick={{ fontSize: 11 }}
              label={{ value: 'Annual Cash Flows', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
            />
            {/* Right Y-axis for cumulative returns */}
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(value) => formatCurrencyMillions(value)}
              width={80}
              tick={{ fontSize: 11 }}
              stroke="#4B0082"
              domain={[
                (dataMin: number) => dataMin * 0.5,
                (dataMax: number) => dataMax * 1.1
              ]}
              label={{ value: 'Cumulative Returns', angle: 90, position: 'insideRight', style: { fontSize: 12, fill: '#4B0082' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {/* Annual flows on left axis */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="operatingCashFlow"
              stroke="#276221"
              strokeWidth={2}
              name="Operating Cash Flow"
              dot={{ fill: '#276221', r: 3 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="taxBenefit"
              stroke="#92C3C2"
              strokeWidth={2}
              name="Tax Benefits"
              dot={{ fill: '#92C3C2', r: 3 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="subDebtInterest"
              stroke="#FFA500"
              strokeWidth={2}
              name="Sub-Debt Interest"
              dot={{ fill: '#FFA500', r: 3 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="totalCashFlow"
              stroke="#8B0000"
              strokeWidth={3}
              name="Total Cash Flow"
              dot={{ fill: '#8B0000', r: 4 }}
            />
            {/* Cumulative returns on right axis */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cumulative"
              stroke="#4B0082"
              strokeWidth={3}
              name="Cumulative Returns"
              strokeDasharray="5 5"
              dot={{ fill: '#4B0082', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 rounded bg-gray-100 p-4">
          <p className="text-xs text-gray-500">
            <strong>Note:</strong> Total Cash Flow includes operating cash flows, tax benefits, and sub-debt interest.
            Exit proceeds of {formatCurrencyMillions(exitProceeds)} are included in the final year.
          </p>
        </div>
      </div>

      {/* HDC Cash Flow Timeline with Dual Y-Axes */}
      {hdcCashFlows.length > 0 && (
        <div className="rounded-xl bg-white p-4 shadow-md">
          <h6 className="mb-4 text-base font-medium" style={{ color: '#BF7041' }}>
            HDC Cash Flow Timeline
          </h6>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={hdcCashFlowData} margin={{ top: 5, right: 60, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              {/* Left Y-axis for annual income */}
              <YAxis
                yAxisId="left"
                orientation="left"
                tickFormatter={(value) => formatCurrencyMillions(value)}
                width={80}
                tick={{ fontSize: 11 }}
                label={{ value: 'Annual Income', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
              />
              {/* Right Y-axis for cumulative returns */}
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(value) => formatCurrencyMillions(value)}
                width={80}
                tick={{ fontSize: 11 }}
                stroke="#4B0082"
                domain={[
                  (dataMin: number) => dataMin * 0.5,
                  (dataMax: number) => dataMax * 1.1
                ]}
                label={{ value: 'Cumulative Returns', angle: 90, position: 'insideRight', style: { fontSize: 12, fill: '#4B0082' } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {/* Annual income on left axis */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="aumFeeIncome"
                stroke="#FF6B6B"
                strokeWidth={2}
                name="AUM Fee Income"
                dot={{ fill: '#FF6B6B', r: 3 }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="taxBenefitFee_REMOVED"
                stroke="#FFA500"
                strokeWidth={2}
                name="Tax Benefit Fee"
                dot={{ fill: '#FFA500', r: 3 }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="philanthropicShare"
                stroke="#4ECDC4"
                strokeWidth={2}
                name="Philanthropic Share"
                dot={{ fill: '#4ECDC4', r: 3 }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="promoteShare"
                stroke="#95E1D3"
                strokeWidth={2}
                name="Promote Share"
                dot={{ fill: '#95E1D3', r: 3 }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="totalCashFlow"
                stroke="#8B0000"
                strokeWidth={3}
                name="Total Cash Flow"
                dot={{ fill: '#8B0000', r: 4 }}
              />
              {/* Cumulative returns on right axis */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cumulative"
                stroke="#4B0082"
                strokeWidth={3}
                name="Cumulative Returns"
                strokeDasharray="5 5"
                dot={{ fill: '#4B0082', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 rounded bg-gray-100 p-4">
            <p className="text-xs text-gray-500">
              <strong>Note:</strong> Total Cash Flow includes AUM fees, tax benefit fees, and promote share.
              Exit proceeds of {formatCurrencyMillions(hdcExitProceeds)} are included in the final year.
            </p>
          </div>
        </div>
      )}

      {/* Depreciation Schedule */}
      {depreciationData.length > 0 && (
        <div className="rounded-xl bg-white p-4 shadow-md">
          <h6 className="mb-4 text-base font-medium" style={{ color: '#407F7F' }}>
            Depreciation Schedule & Tax Benefits
          </h6>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={depreciationData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis
                tickFormatter={(value) => formatCurrencyMillions(value)}
                width={80}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="bonusDepreciation" stackId="depreciation" fill="#92C3C2" name="Bonus Depreciation" />
              <Bar dataKey="straightLineDepreciation" stackId="depreciation" fill="#4ECDC4" name="Straight-Line Depreciation" />
              <Line
                type="monotone"
                dataKey="totalTaxBenefit"
                stroke="#276221"
                strokeWidth={3}
                name="Total Tax Benefit"
                dot={{ fill: '#276221', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="netBenefit"
                stroke="#8B0000"
                strokeWidth={2}
                name="Net Benefit (After HDC Fee)"
                strokeDasharray="5 5"
                dot={{ fill: '#8B0000', r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="mt-4 rounded bg-gray-100 p-4">
            <p className="text-xs text-gray-500">
              <strong>Note:</strong> Net benefit reflects tax benefits after HDC's 10% fee.
              Bonus depreciation typically occurs in Year 1, while straight-line depreciation continues over the property's useful life.
            </p>
          </div>
        </div>
      )}

      {/* Investor vs HDC Returns Comparison */}
      {hdcTotalReturns > 0 && (
        <div className="rounded-xl bg-white p-4 shadow-md">
          <h6 className="mb-4 text-base font-medium" style={{ color: '#407F7F' }}>
            Investor vs HDC Returns Comparison
          </h6>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={returnsComparisonData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis
                tickFormatter={(value) => formatCurrencyMillions(value)}
                width={80}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {/* Investor bars - matching Investor Cash Flow Timeline colors */}
              <Bar dataKey="taxBenefits" name="Tax Benefits" stackId="stack" fill="#54BFBF" />
              <Bar dataKey="operatingCashFlow" name="Operating Cash Flow" stackId="stack" fill="#7FBD45" />
              <Bar dataKey="subDebtInterest" name="Sub-Debt Interest" stackId="stack" fill="#BFB05E" />
              <Bar dataKey="exitProceeds" name="Exit Proceeds" stackId="stack" fill="#407F7F" />
              {/* HDC bars - matching HDC Cash Flow Timeline colors */}
              <Bar dataKey="aumFees" name="AUM Fees" stackId="stack" fill="#43778A" />
              <Bar dataKey="promoteShare" name="Promote Share" stackId="stack" fill="#7FBD45" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 rounded bg-gray-100 p-4">
            <p className="text-xs text-gray-500">
              <strong>Note:</strong> Stacked bars show the constituent parts of total returns for each party.
              Colors match the corresponding cash flow timeline charts.
            </p>
          </div>
        </div>
      )}

      {/* DSCR Analysis with Optimized Scale */}
      {dscrData.length > 0 && dscrData[0].operationalDSCR > 0 && (
        <div className="rounded-xl bg-white p-4 shadow-md">
          <h6 className="mb-4 text-base font-medium" style={{ color: '#407F7F' }}>
            Debt Service Coverage Ratio (DSCR) Analysis
          </h6>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={dscrData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis
                width={60}
                tick={{ fontSize: 12 }}
                domain={[0.8, 'auto']}
                label={{ value: 'DSCR (x)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="operationalDSCR"
                stroke="#92C3C2"
                strokeWidth={2}
                name="Operational DSCR"
                dot={{ fill: '#92C3C2', r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="finalDSCR"
                stroke="#276221"
                strokeWidth={3}
                name="Final DSCR (After Cash Management)"
                dot={{ fill: '#276221', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="targetDSCR"
                stroke="#8B0000"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Target DSCR (1.05x)"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 rounded bg-gray-100 p-4">
            <p className="text-xs text-gray-500">
              <strong>Note:</strong> The cash management system targets exactly 1.05x DSCR coverage,
              distributing all excess cash above this level. Payment deferrals occur automatically when needed.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricsCharts;