/**
 * Equity Linearity Analysis - Fixed Version
 * Uses correct property paths: results.investorCashFlows[0].taxBenefit
 */

import { calculateFullInvestorAnalysis } from '../../calculations.js';
import { getDefaultTestParams } from '../test-helpers.js';
import { calculateDepreciableBasis } from '../../depreciableBasisUtility.js';

interface EquityDataPoint {
  investorEquityPct: number;
  investorEquityAmount: number;
  philDebtPct: number;
  philDebtAmount: number;
  depreciableBasis: number;
  year1Depreciation: number;
  year1GrossTaxBenefit: number;
  year1NetBenefit: number;
  coverageRatio: number;
}

function runAnalysis(): EquityDataPoint[] {
  const results: EquityDataPoint[] = [];
  const projectCostInMillions = 100; // $100M

  for (let equityPct = 1; equityPct <= 15; equityPct++) {
    try {
      const params = getDefaultTestParams({
        projectCost: projectCostInMillions,
        landValue: 10,
        seniorDebtPct: 65,
        philanthropicDebtPct: 100 - 65 - equityPct,
        investorEquityPct: equityPct,
        yearOneNOI: 5.5,
        yearOneDepreciationPct: 25,
        effectiveTaxRate: 47.85,
        hdcFeeRate: 0,
        exitCapRate: 5.5,
        opexRatio: 25,
        revenueGrowth: 3.0,
        expenseGrowth: 3.0,
      });

      const analysis = calculateFullInvestorAnalysis(params);

      // CORRECT PROPERTY PATH: investorCashFlows[0].taxBenefit
      const year1NetBenefit = analysis.investorCashFlows[0]?.taxBenefit || 0;

      // Calculate depreciable basis using utility function
      const depreciableBasis = calculateDepreciableBasis({
        projectCost: projectCostInMillions,
        predevelopmentCosts: 0,
        landValue: 10,
        investorEquityPct: equityPct,
        interestReserve: analysis.interestReserveAmount || 0,
      });

      // Year 1 depreciation = depreciableBasis × 25%
      const year1Depreciation = depreciableBasis * 0.25;
      const year1GrossTaxBenefit = year1Depreciation * 0.4785;

      const philDebtPct = 100 - 65 - equityPct;
      const investorEquityAmount = projectCostInMillions * (equityPct / 100);

      const dataPoint: EquityDataPoint = {
        investorEquityPct: equityPct,
        investorEquityAmount,
        philDebtPct,
        philDebtAmount: projectCostInMillions * (philDebtPct / 100),
        depreciableBasis,
        year1Depreciation,
        year1GrossTaxBenefit,
        year1NetBenefit,
        coverageRatio: year1NetBenefit / investorEquityAmount,
      };

      results.push(dataPoint);
      console.log(`✓ ${equityPct}%: Basis=$${depreciableBasis.toFixed(1)}M, NetBenefit=$${year1NetBenefit.toFixed(2)}M`);

    } catch (error) {
      console.error(`✗ Error at ${equityPct}%:`, error instanceof Error ? error.message : error);
    }
  }

  return results;
}

function analyzeLinearity(data: EquityDataPoint[]): {
  isLinear: boolean;
  slope: number;
  intercept: number;
  rSquared: number;
} {
  const n = data.length;
  const x = data.map(d => d.investorEquityPct);
  const y = data.map(d => d.year1NetBenefit);

  const xMean = x.reduce((a, b) => a + b, 0) / n;
  const yMean = y.reduce((a, b) => a + b, 0) / n;

  const numerator = x.reduce((sum, xi, i) => sum + (xi - xMean) * (y[i] - yMean), 0);
  const denominator = x.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0);
  const slope = numerator / denominator;
  const intercept = yMean - slope * xMean;

  const yPredicted = x.map(xi => slope * xi + intercept);
  const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - yPredicted[i], 2), 0);
  const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
  const rSquared = 1 - (ssRes / ssTot);

  return {
    isLinear: rSquared > 0.98,
    slope,
    intercept,
    rSquared,
  };
}

function formatCSV(data: EquityDataPoint[]): string {
  const headers = [
    'Equity %',
    'Equity ($M)',
    'Phil Debt %',
    'Phil Debt ($M)',
    'Depreciable Basis ($M)',
    'Year 1 Depreciation ($M)',
    'Year 1 Gross Tax Benefit ($M)',
    'Year 1 Net Benefit ($M)',
    'Coverage Ratio',
  ];

  const rows = data.map(d => [
    d.investorEquityPct,
    d.investorEquityAmount.toFixed(2),
    d.philDebtPct.toFixed(1),
    d.philDebtAmount.toFixed(2),
    d.depreciableBasis.toFixed(2),
    d.year1Depreciation.toFixed(2),
    d.year1GrossTaxBenefit.toFixed(2),
    d.year1NetBenefit.toFixed(2),
    d.coverageRatio.toFixed(4),
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

// EXECUTE
console.log('=== Equity % to Year 1 Tax Benefit Linearity Analysis ===\n');
console.log('Running calculations (1% through 15% equity)...\n');

const data = runAnalysis();

if (data.length > 0) {
  console.log(`\n✓ Completed ${data.length} data points\n`);

  const linear = analyzeLinearity(data);

  console.log('=== LINEARITY ANALYSIS ===');
  console.log(`Linear: ${linear.isLinear ? 'YES' : 'NO'}`);
  console.log(`R² = ${linear.rSquared.toFixed(6)}`);
  console.log(`Formula: Net Benefit = ${linear.intercept.toFixed(2)} + (${linear.slope.toFixed(2)} × Equity %)`);
  console.log(`Slope: ${linear.slope < 0 ? 'NEGATIVE' : 'POSITIVE'} (${linear.slope.toFixed(2)} per percentage point)\n`);

  console.log('=== CSV DATA ===\n');
  console.log(formatCSV(data));

  console.log('\n=== SUMMARY ===');
  console.log(`At 1% equity:  Net Benefit = $${data[0].year1NetBenefit.toFixed(2)}M`);
  console.log(`At 15% equity: Net Benefit = $${data[data.length - 1].year1NetBenefit.toFixed(2)}M`);
  console.log(`Total change: $${(data[0].year1NetBenefit - data[data.length - 1].year1NetBenefit).toFixed(2)}M`);
  console.log(`Change per %: $${((data[0].year1NetBenefit - data[data.length - 1].year1NetBenefit) / 14).toFixed(3)}M`);
} else {
  console.error('❌ No data points calculated successfully');
}
