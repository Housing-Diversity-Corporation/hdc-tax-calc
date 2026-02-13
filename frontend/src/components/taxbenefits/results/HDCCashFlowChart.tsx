import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import type { HDCCashFlowItem, HDCAnalysisResults } from '../../../types/taxbenefits';

interface HDCCashFlowChartProps {
  hdcCashFlows: HDCCashFlowItem[];
  hdcExitProceeds: number;
  hdcTotalReturns: number;
  hdcAnalysisResults: HDCAnalysisResults;
  formatCurrency: (value: number) => string;
}

const HDCCashFlowChart: React.FC<HDCCashFlowChartProps> = ({
  hdcCashFlows,
  hdcExitProceeds,
  hdcTotalReturns,
  hdcAnalysisResults,
  formatCurrency
}) => {
  // Prepare chart data
  const chartData = hdcCashFlows.map(cf => ({
    year: `Y${cf.year}`,
    cumulativeReturns: cf.cumulativeReturns,
    aumFeeIncome: cf.aumFeeIncome || 0,
    hdcFeeIncome: cf.hdcFeeIncome,
    promoteShare: cf.promoteShare || 0,
    totalCashFlow: cf.totalCashFlow
  }));

  // Debug: Check what data we have
  const hasData = hdcCashFlows.some(cf =>
    (cf.hdcFeeIncome || 0) > 0 || (cf.promoteShare || 0) > 0
  );

  // Add exit year data
  const lastYear = hdcCashFlows.length;
  chartData.push({
    year: `Y${lastYear + 1}`,
    cumulativeReturns: hdcTotalReturns,
    aumFeeIncome: 0,
    hdcFeeIncome: 0,
    promoteShare: 0,
    totalCashFlow: hdcExitProceeds
  });

  // Calculate max values for proper Y-axis scaling
  const annualData = chartData.slice(0, -1); // Exclude exit year
  const annualIncomes = annualData.map(d => (d.aumFeeIncome || 0) + (d.promoteShare || 0));
  const maxAnnualIncomeFromData = Math.max(...annualIncomes, 0);
  const maxAnnualIncome = Math.max(maxAnnualIncomeFromData, 0.1); // Minimum scale of $100K (0.1M)

  const cumulativeValues = chartData.map(d => d.cumulativeReturns || 0);
  const maxCumulativeFromData = Math.max(...cumulativeValues, 0);
  const maxCumulativeReturns = Math.max(maxCumulativeFromData, 0.1); // Minimum scale of $100K (0.1M)

  console.log('🔍 HDC Chart Debug:', {
    hdcCashFlowsLength: hdcCashFlows.length,
    hasData,
    sampleYear1Raw: hdcCashFlows[0] ? {
      hdcFeeIncome: hdcCashFlows[0].hdcFeeIncome,
      promoteShare: hdcCashFlows[0].promoteShare,
      cumulativeReturns: hdcCashFlows[0].cumulativeReturns
    } : 'No data',
    sampleYear1Chart: chartData[0],
    exitYearChart: chartData[chartData.length - 1],
    annualIncomesArray: annualIncomes.slice(0, 3),
    maxAnnualIncomeFromData,
    maxAnnualIncome,
    cumulativeValuesArray: cumulativeValues.slice(0, 3),
    maxCumulativeFromData,
    maxCumulativeReturns,
    chartDataLength: chartData.length
  });

  if (!hasData) {
    console.warn('⚠️ HDC Chart: All annual cash flows are ZERO (fees deferred due to DSCR). HDC collects fees at exit.');
  }

  // Format tooltip values (value is in millions)
  const formatTooltip = (value: number | undefined) => {
    if (value === 0 || value === null || value === undefined) return '$0';
    const valueInDollars = value * 1000000; // Convert millions to dollars
    const absValue = Math.abs(valueInDollars);
    if (absValue >= 1000000) {
      return `$${(valueInDollars / 1000000).toFixed(2)}M`;
    } else if (absValue >= 1000) {
      return `$${(valueInDollars / 1000).toFixed(0)}K`;
    } else {
      return `$${valueInDollars.toFixed(0)}`;
    }
  };

  // Custom formatter for Y-axis - data is in millions, so convert to display format
  // ISS-067: Standardized to 2 decimals for consistency with formatAbbreviatedCurrency
  const formatYAxis = (value: number) => {
    if (value === 0) return '$0';
    // Value is in millions (e.g., 1.5 means $1.5M)
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
    <div style={{ width: '100%', marginTop: '1.5rem' }}>
      <h4 style={{
        fontSize: '0.9rem',
        fontWeight: 600,
        marginBottom: '1rem',
        color: '#333'
      }}>
        HDC Cash Flow Timeline
      </h4>

      {/* Chart 1: Annual Fee Breakdown (Stacked Bars) */}
      <div style={{ marginBottom: '2rem' }}>
        <h5 style={{
          fontSize: '0.85rem',
          fontWeight: 500,
          marginBottom: '0.5rem',
          color: '#666'
        }}>
          Annual Fee Income
        </h5>
        {!hasData && (
          <div style={{
            padding: '1rem',
            border: '1px solid #ffc107',
            borderRadius: '4px',
            marginBottom: '0.5rem',
            fontSize: '0.85rem',
            color: '#856404',
            opacity: 0.9
          }}>
            <strong>ℹ️ No Annual Cash Flows:</strong> All HDC fees are being deferred due to DSCR constraints.
            HDC will collect accumulated fees at exit. Check the cumulative returns chart below to see total returns including exit proceeds.
          </div>
        )}
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={chartData.slice(0, -1)} // Exclude exit year for annual chart
            margin={{ top: 5, right: 30, left: 15, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 12 }}
              stroke="#666"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              stroke="#666"
              tickFormatter={formatYAxis}
              width={70}
              domain={[0, Math.ceil(maxAnnualIncome * 1.1)]}
              tickCount={6}
              label={{
                value: 'Annual Income',
                angle: -90,
                position: 'insideLeft',
                offset: 10,
                style: { fontSize: 11, fill: '#666', textAnchor: 'middle' }
              }}
            />
            <Tooltip
              formatter={formatTooltip}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            />
            <Bar
              dataKey="taxBenefitFee_REMOVED"
              name="Tax Benefit Fee"
              stackId="fees"
              fill="#BF7041"
            />
            <Bar
              dataKey="aumFeeIncome"
              name="AUM Fee Income"
              stackId="fees"
              fill="#43778A"
            />
            <Bar
              dataKey="promoteShare"
              name="Promote Share"
              stackId="fees"
              fill="#7FBD45"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chart 2: Cumulative Returns (Area Chart) */}
      <div>
        <h5 style={{
          fontSize: '0.85rem',
          fontWeight: 500,
          marginBottom: '0.5rem',
          color: '#666'
        }}>
          Cumulative Returns Growth
        </h5>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 15, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorReturns" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#407F7F" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#407F7F" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 12 }}
              stroke="#666"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              stroke="#7c3aed"
              tickFormatter={formatYAxis}
              width={70}
              domain={[0, Math.ceil(maxCumulativeReturns * 1.1)]}
              tickCount={6}
              label={{
                value: 'Cumulative Returns',
                angle: -90,
                position: 'insideLeft',
                offset: 10,
                style: { fontSize: 11, fill: '#7c3aed', textAnchor: 'middle' }
              }}
            />
            <Tooltip
              formatter={formatTooltip}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            />
            <Area
              type="monotone"
              dataKey="cumulativeReturns"
              name="Cumulative Returns"
              stroke="#407F7F"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorReturns)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Chart 3: Exit Proceeds Waterfall */}
      <div style={{ marginTop: '2rem' }}>
        <h5 style={{
          fontSize: '0.85rem',
          fontWeight: 500,
          marginBottom: '0.5rem',
          color: '#666'
        }}>
          Exit Proceeds Breakdown (Year 11)
        </h5>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart
            layout="vertical"
            data={[{
              name: 'Exit',
              deferredTaxFees: (hdcAnalysisResults.hdcDeferredTaxFeesAtExit || 0) / 1000000,
              deferredAumFees: (hdcAnalysisResults.accumulatedAumFeesAtExit || 0) / 1000000,
              promoteShare: (hdcAnalysisResults.hdcPromoteProceeds || 0) / 1000000,
              subDebtCollection: (hdcAnalysisResults.hdcSubDebtRepayment || 0) / 1000000
            }]}
            margin={{ top: 5, right: 30, left: 15, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              type="number"
              tick={{ fontSize: 11 }}
              stroke="#666"
              tickFormatter={(value) => {
                if (value === 0) return '$0';
                const valueInDollars = value * 1000000;
                return `$${valueInDollars.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
              }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11 }}
              stroke="#666"
            />
            <Tooltip
              formatter={formatTooltip}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            />
            <Bar dataKey="deferredTaxFees" name="Deferred Tax Benefit Fees" stackId="exit" fill="#BF7041" />
            <Bar dataKey="deferredAumFees" name="Deferred AUM Fees" stackId="exit" fill="#43778A" />
            <Bar dataKey="promoteShare" name="Promote Share" stackId="exit" fill="#7FBD45" />
            <Bar dataKey="subDebtCollection" name="Sub-Debt Collection" stackId="exit" fill="#54BFBF" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{
        fontSize: '0.75rem',
        color: '#666',
        marginTop: '1rem',
        padding: '0.75rem',
        backgroundColor: '#f9fafb',
        borderRadius: '4px'
      }}>
        <strong>Note:</strong> Annual fees show the composition of HDC income each year.
        Cumulative returns include all fees plus exit proceeds of {formatCurrency(hdcExitProceeds)}.
        Exit breakdown shows components collected at sale (Year 11).
      </div>
    </div>
  );
};

export default HDCCashFlowChart;
