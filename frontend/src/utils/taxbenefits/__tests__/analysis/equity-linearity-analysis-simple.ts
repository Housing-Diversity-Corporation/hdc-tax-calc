/**
 * Simplified Equity % to Year 1 Tax Benefit Linearity Analysis
 * Uses test helpers for proper parameter setup
 */

import { calculateFullInvestorAnalysis } from '../../calculations.js';
import { getDefaultTestParams } from '../test-helpers.js';

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

/**
 * Run analysis across equity percentages 1% through 15%
 */
function runEquityLinearityAnalysis(): EquityDataPoint[] {
  const results: EquityDataPoint[] = [];
  const projectCost = 100_000_000; // $100M

  for (let equityPct = 1; equityPct <= 15; equityPct++) {
    try {
      // Use test helper to get proper defaults
      const params = getDefaultTestParams({
        projectCost: 100, // $100M in millions
        landValue: 10,    // $10M
        seniorDebtPct: 65,
        philanthropicDebtPct: 100 - 65 - equityPct, // Calculated
        investorEquityPct: equityPct,
        yearOneNOI: 5.5,
        yearOneDepreciationPct: 25,
        effectiveTaxRate: 47.85,
        hdcFeeRate: 0,
        exitCapRate: 5.5,
        opexRatio: 25,
      });

      const analysis = calculateFullInvestorAnalysis(params);

      // The function returns an object with investorReturns, taxBenefits, and other data
      const philDebtPct = 100 - 65 - equityPct;
      const philDebtAmount = (projectCost * philDebtPct) / 100;
      const investorEquityAmount = (projectCost * equityPct) / 100;

      // Get year 1 data from the analysis
      const year1NetBenefit = analysis?.investorReturns?.yearlyReturns?.[0]?.netTaxBenefit || 0;
      const year1Depreciation = analysis?.taxBenefits?.yearlySchedule?.[0]?.depreciation || 0;
      const depreciableBasis = analysis?.taxBenefits?.depreciableBasis || 0;

      const dataPoint: EquityDataPoint = {
        investorEquityPct: equityPct,
        investorEquityAmount,
        philDebtPct,
        philDebtAmount,
        depreciableBasis,
        year1Depreciation,
        year1GrossTaxBenefit: year1Depreciation * (47.85 / 100),
        year1NetBenefit,
        coverageRatio: year1NetBenefit / investorEquityAmount,
      };

      results.push(dataPoint);
      console.log(`✓ Equity ${equityPct}%: Net Benefit = $${(year1NetBenefit / 1_000_000).toFixed(2)}M`);

    } catch (error) {
      console.error(`Error calculating equity ${equityPct}%:`, error);
    }
  }

  return results;
}

/**
 * Format results as CSV
 */
function formatAsCSV(data: EquityDataPoint[]): string {
  const headers = [
    'Equity %',
    'Equity Amount ($M)',
    'Phil Debt %',
    'Phil Debt Amount ($M)',
    'Depreciable Basis ($M)',
    'Year 1 Depreciation ($M)',
    'Year 1 Gross Tax Benefit ($M)',
    'Year 1 Net Benefit ($M)',
    'Coverage Ratio',
  ];

  const rows = data.map(d => [
    d.investorEquityPct,
    (d.investorEquityAmount / 1_000_000).toFixed(2),
    d.philDebtPct.toFixed(1),
    (d.philDebtAmount / 1_000_000).toFixed(2),
    (d.depreciableBasis / 1_000_000).toFixed(2),
    (d.year1Depreciation / 1_000_000).toFixed(2),
    (d.year1GrossTaxBenefit / 1_000_000).toFixed(2),
    (d.year1NetBenefit / 1_000_000).toFixed(2),
    d.coverageRatio.toFixed(4),
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');
}

/**
 * Analyze linearity using linear regression
 */
function analyzeLinearity(data: EquityDataPoint[]): {
  isLinear: boolean;
  slope: number;
  intercept: number;
  rSquared: number;
} {
  const n = data.length;
  const x = data.map(d => d.investorEquityPct);
  const y = data.map(d => d.year1NetBenefit / 1_000_000); // Convert to millions

  // Calculate means
  const xMean = x.reduce((a, b) => a + b, 0) / n;
  const yMean = y.reduce((a, b) => a + b, 0) / n;

  // Calculate slope and intercept
  const numerator = x.reduce((sum, xi, i) => sum + (xi - xMean) * (y[i] - yMean), 0);
  const denominator = x.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0);
  const slope = numerator / denominator;
  const intercept = yMean - slope * xMean;

  // Calculate R²
  const yPredicted = x.map(xi => slope * xi + intercept);
  const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - yPredicted[i], 2), 0);
  const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
  const rSquared = 1 - (ssRes / ssTot);

  const isLinear = rSquared > 0.98;

  return { isLinear, slope, intercept, rSquared };
}

/**
 * Main execution
 */
function executeAnalysis(): void {
  console.log('=== Equity % to Year 1 Tax Benefit Linearity Analysis ===\n');
  console.log('Running calculations for equity percentages 1% through 15%...\n');

  const data = runEquityLinearityAnalysis();

  console.log(`\nCompleted ${data.length} data points.\n`);

  if (data.length > 0) {
    const linearityAnalysis = analyzeLinearity(data);

    console.log('=== RESULTS ===\n');
    console.log(`Linear Relationship: ${linearityAnalysis.isLinear ? 'YES' : 'NO'}`);
    console.log(`R² = ${linearityAnalysis.rSquared.toFixed(6)}`);
    console.log(`Formula: Net Benefit ($M) = ${linearityAnalysis.intercept.toFixed(2)} + (${linearityAnalysis.slope.toFixed(2)} × Equity %)\n`);

    console.log('=== CSV DATA ===\n');
    console.log(formatAsCSV(data));

    console.log('\n=== SUMMARY ===\n');
    console.log(`At 1% equity: Net Benefit = $${(data[0].year1NetBenefit / 1_000_000).toFixed(2)}M`);
    console.log(`At 15% equity: Net Benefit = $${(data[data.length - 1].year1NetBenefit / 1_000_000).toFixed(2)}M`);
    console.log(`Total change: $${((data[0].year1NetBenefit - data[data.length - 1].year1NetBenefit) / 1_000_000).toFixed(2)}M`);
    console.log(`Per percentage point: $${((data[0].year1NetBenefit - data[data.length - 1].year1NetBenefit) / 14 / 1_000_000).toFixed(2)}M`);
  } else {
    console.error('No data points were successfully calculated.');
  }
}

executeAnalysis();
