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
import type { CashFlowItem, InvestorAnalysisResults } from '../../../types/taxbenefits';

interface InvestorCashFlowChartProps {
  investorCashFlows: CashFlowItem[];
  exitProceeds: number;
  totalReturns: number;
  mainAnalysisResults: InvestorAnalysisResults;
  formatCurrency: (value: number) => string;
}

const InvestorCashFlowChart: React.FC<InvestorCashFlowChartProps> = ({
  investorCashFlows,
  exitProceeds,
  totalReturns,
  mainAnalysisResults,
  formatCurrency
}) => {
  // Prepare chart data
  const chartData = investorCashFlows.map(cf => ({
    year: `Y${cf.year}`,
    cumulativeReturns: cf.cumulativeReturns,
    operatingCashFlow: cf.operatingCashFlow,
    subDebtInterest: cf.subDebtInterest || 0,
    taxBenefits: cf.taxBenefit,
    totalCashFlow: cf.totalCashFlow
  }));

  // Add exit year data
  const lastYear = investorCashFlows.length;
  chartData.push({
    year: `Y${lastYear + 1}`,
    cumulativeReturns: totalReturns,
    operatingCashFlow: exitProceeds,
    subDebtInterest: 0,
    taxBenefits: 0,
    totalCashFlow: exitProceeds
  });

  // Format tooltip values
  const formatTooltip = (value: number) => {
    return formatCurrency(value);
  };

  // Custom formatter for Y-axis - auto-scale based on magnitude
  // ISS-067: Standardized to 2 decimals for consistency with formatAbbreviatedCurrency
  const formatYAxis = (value: number) => {
    if (value === 0) return '$0';
    const absValue = Math.abs(value);
    if (absValue >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (absValue >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    } else {
      return `$${value.toFixed(0)}`;
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
        Investor Cash Flow Timeline
      </h4>

      {/* Chart 1: Annual Cash Flow Breakdown (Stacked Bars) */}
      <div style={{ marginBottom: '2rem' }}>
        <h5 style={{
          fontSize: '0.85rem',
          fontWeight: 500,
          marginBottom: '0.5rem',
          color: '#666'
        }}>
          Annual Cash Flow Composition
        </h5>
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
              label={{
                value: 'Annual Cash Flow',
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
              dataKey="taxBenefits"
              name="Tax Benefits"
              stackId="cashflow"
              fill="#54BFBF"
            />
            <Bar
              dataKey="operatingCashFlow"
              name="Operating Cash Flow"
              stackId="cashflow"
              fill="#7FBD45"
            />
            <Bar
              dataKey="subDebtInterest"
              name="Sub-Debt Interest"
              stackId="cashflow"
              fill="#BFB05E"
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
              <linearGradient id="colorInvestorReturns" x1="0" y1="0" x2="0" y2="1">
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
              stroke="#407F7F"
              tickFormatter={formatYAxis}
              width={70}
              label={{
                value: 'Cumulative Returns',
                angle: -90,
                position: 'insideLeft',
                offset: 10,
                style: { fontSize: 11, fill: '#407F7F', textAnchor: 'middle' }
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
              fill="url(#colorInvestorReturns)"
            />
          </AreaChart>
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
        <strong>Note:</strong> Annual cash flows show tax benefits, operating distributions, and sub-debt interest.
        Cumulative returns include all annual cash flows plus exit proceeds of {formatCurrency(exitProceeds)}.
      </div>
    </div>
  );
};

export default InvestorCashFlowChart;
