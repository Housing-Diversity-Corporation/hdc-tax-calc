/**
 * Equity % to Year 1 Tax Benefit Linearity Analysis
 *
 * Tests the relationship between investor equity percentage and Year 1 net tax benefit
 * to determine if the relationship is linear or non-linear.
 *
 * Reference: TaxBenefits Constitution v2.0, CALCULATION_FLOW_ORDER.md
 */

import { calculateFullInvestorAnalysis } from '../../calculations.js';
import type { CalculationParams } from '../../../../types/taxbenefits/index.js';

interface EquityDataPoint {
  investorEquityPct: number;
  investorEquityAmount: number;
  effectiveProjectCost: number;
  depreciableBasis: number;
  year1Depreciation: number;
  year1GrossTaxBenefit: number;
  year1NetBenefit: number;
  coverageRatio: number;
  philDebtPct: number;
  philDebtAmount: number;
}

/**
 * Base parameters held constant across all iterations
 */
const BASE_PARAMS: Omit<CalculationParams, 'investorEquityPct'> = {
  projectCost: 100_000_000,
  landValue: 10_000_000,
  predevelopmentCost: 0,
  seniorDebtPct: 65,
  seniorDebtRate: 6.5,
  seniorDebtTermYears: 30,
  philDebtRate: 3.0,
  yearOneDepreciationPct: 25,
  effectiveTaxRate: 47.85,
  hdcTaxBenefitFee_REMOVED: 10,

  // Required fields with defaults
  seniorDebtAmortizationYears: 30,
  stabilizationYear: 2,
  exitYear: 10,
  yearOneNOI: 5_500_000, // 5.5% yield on $100M
  noiGrowthRate: 3.0,
  capRate: 5.5,
  targetDSCR: 1.05,

  // OZ parameters
  hasOZGain: true,
  ozGainAmount: 10_000_000,
  ozGainYear: 5,
  ozBasisStepUpPct: 10,

  // Interest reserve defaults
  enableInterestReserve: true,
  interestReserveCoverageMonths: 18,

  // Tax parameters
  federalTaxRate: 37.0,
  stateTaxRate: 13.3,
  federalCapGainsRate: 20.0,
  stateCapGainsRate: 13.3,
  deprecRecaptureRate: 25.0,
};

/**
 * Run analysis across equity percentages 1% through 15%
 */
function runEquityLinearityAnalysis(): EquityDataPoint[] {
  const results: EquityDataPoint[] = [];

  for (let equityPct = 1; equityPct <= 15; equityPct++) {
    const input: CalculationParams = {
      ...BASE_PARAMS,
      investorEquityPct: equityPct,
    };

    try {
      const analysis = calculateFullInvestorAnalysis(input);

      // Calculate philanthropic debt percentage
      const philDebtPct = 100 - BASE_PARAMS.seniorDebtPct - equityPct;
      const philDebtAmount = (BASE_PARAMS.projectCost * philDebtPct) / 100;

      // Extract Year 1 data
      const year1Data = analysis.investorReturns.yearlyReturns[0];

      const dataPoint: EquityDataPoint = {
        investorEquityPct: equityPct,
        investorEquityAmount: analysis.capitalStructure.investorEquity,
        effectiveProjectCost: BASE_PARAMS.projectCost,
        depreciableBasis: analysis.depreciationSchedule.depreciableBasis,
        year1Depreciation: year1Data.depreciation,
        year1GrossTaxBenefit: year1Data.depreciation * (BASE_PARAMS.effectiveTaxRate / 100),
        year1NetBenefit: year1Data.netTaxBenefit,
        coverageRatio: year1Data.netTaxBenefit / analysis.capitalStructure.investorEquity,
        philDebtPct,
        philDebtAmount,
      };

      results.push(dataPoint);

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
    'Equity Amount',
    'Effective Cost',
    'Depreciable Basis',
    'Year 1 Depreciation',
    'Year 1 Gross Tax Benefit',
    'Year 1 Net Benefit',
    'Coverage Ratio',
    'Phil Debt %',
    'Phil Debt Amount',
  ];

  const rows = data.map(d => [
    d.investorEquityPct,
    d.investorEquityAmount.toFixed(2),
    d.effectiveProjectCost.toFixed(2),
    d.depreciableBasis.toFixed(2),
    d.year1Depreciation.toFixed(2),
    d.year1GrossTaxBenefit.toFixed(2),
    d.year1NetBenefit.toFixed(2),
    d.coverageRatio.toFixed(4),
    d.philDebtPct.toFixed(2),
    d.philDebtAmount.toFixed(2),
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
  explanation: string;
} {
  const n = data.length;
  const x = data.map(d => d.investorEquityPct);
  const y = data.map(d => d.year1NetBenefit);

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

  // Determine linearity (R² > 0.98 considered highly linear)
  const isLinear = rSquared > 0.98;

  let explanation = '';
  if (isLinear) {
    explanation = `Strong linear relationship detected (R² = ${rSquared.toFixed(6)}).
The relationship follows: Net Benefit = ${intercept.toFixed(2)} + (${slope.toFixed(2)} × Equity %)
This indicates that for each 1% increase in equity, Year 1 net benefit decreases by approximately $${Math.abs(slope).toFixed(2)}.`;
  } else {
    explanation = `Non-linear relationship detected (R² = ${rSquared.toFixed(6)}).
The deviation from linearity is likely due to:
1. Depreciable basis calculation excluding investor equity (per OZ rules)
2. Interest reserve scaling with debt percentage
3. Phil debt amount changing as equity % changes
4. Potential DSCR adjustments affecting cash management`;
  }

  return { isLinear, slope, intercept, rSquared, explanation };
}

/**
 * Generate markdown documentation
 */
function generateMarkdownReport(data: EquityDataPoint[], linearityAnalysis: ReturnType<typeof analyzeLinearity>): string {
  const markdown = `# Equity % to Year 1 Tax Benefit Linearity Analysis

## Analysis Parameters

**Base Configuration:**
- Project Cost: $100,000,000
- Land Value: $10,000,000 (10%)
- Senior Debt: 65% fixed
- Senior Debt Rate: 6.5%
- Philanthropic Debt Rate: 3.0%
- Year 1 Depreciation: 25% (cost segregation)
- Effective Tax Rate: 47.85% (combined federal + state)
- HDC Tax Benefit Fee: 10%

**Variable:**
- Investor Equity %: 1% through 15%

## Results

### Data Table

| Equity % | Equity Amount | Phil Debt % | Phil Debt Amount | Depreciable Basis | Year 1 Depreciation | Year 1 Gross Tax Benefit | Year 1 Net Benefit | Coverage Ratio |
|----------|---------------|-------------|------------------|-------------------|---------------------|--------------------------|-----------------------|----------------|
${data.map(d => `| ${d.investorEquityPct}% | $${(d.investorEquityAmount / 1_000_000).toFixed(2)}M | ${d.philDebtPct.toFixed(1)}% | $${(d.philDebtAmount / 1_000_000).toFixed(2)}M | $${(d.depreciableBasis / 1_000_000).toFixed(2)}M | $${(d.year1Depreciation / 1_000_000).toFixed(2)}M | $${(d.year1GrossTaxBenefit / 1_000_000).toFixed(2)}M | $${(d.year1NetBenefit / 1_000_000).toFixed(2)}M | ${d.coverageRatio.toFixed(4)} |`).join('\n')}

## Linearity Analysis

**Linear Regression Results:**
- **Slope:** ${linearityAnalysis.slope.toFixed(2)}
- **Intercept:** ${linearityAnalysis.intercept.toFixed(2)}
- **R² (Coefficient of Determination):** ${linearityAnalysis.rSquared.toFixed(6)}
- **Classification:** ${linearityAnalysis.isLinear ? 'LINEAR' : 'NON-LINEAR'}

### Formula

\`\`\`
Year 1 Net Benefit = ${linearityAnalysis.intercept.toFixed(2)} + (${linearityAnalysis.slope.toFixed(2)} × Equity %)
\`\`\`

### Interpretation

${linearityAnalysis.explanation}

## Key Observations

1. **Inverse Relationship:** As investor equity % increases, Year 1 net tax benefit decreases.

2. **Depreciable Basis Impact:**
   - At 1% equity: Depreciable basis ≈ $${(data[0].depreciableBasis / 1_000_000).toFixed(2)}M
   - At 15% equity: Depreciable basis ≈ $${(data[data.length - 1].depreciableBasis / 1_000_000).toFixed(2)}M
   - Reduction: $${((data[0].depreciableBasis - data[data.length - 1].depreciableBasis) / 1_000_000).toFixed(2)}M

3. **Coverage Ratio Pattern:**
   - The coverage ratio (Net Benefit / Equity Amount) ${data[0].coverageRatio > data[data.length - 1].coverageRatio ? 'decreases' : 'increases'} as equity % increases
   - This indicates ${data[0].coverageRatio > data[data.length - 1].coverageRatio ? 'diminishing returns' : 'improving efficiency'} at higher equity levels

4. **Philanthropic Debt Tradeoff:**
   - Phil debt ranges from ${data[0].philDebtPct.toFixed(1)}% (at 1% equity) to ${data[data.length - 1].philDebtPct.toFixed(1)}% (at 15% equity)
   - As equity increases, phil debt decreases proportionally

## Implications for HDC Model

- **Sweet Spot Analysis:** ${linearityAnalysis.isLinear ? 'Linear relationship enables predictable optimization' : 'Non-linear relationship requires careful modeling'}
- **Investor Positioning:** Lower equity % produces higher absolute tax benefits but requires more philanthropic debt
- **Model Stability:** ${linearityAnalysis.rSquared > 0.95 ? 'High R² indicates stable, predictable behavior' : 'Lower R² suggests complex interactions requiring deeper analysis'}

## CSV Export

\`\`\`csv
${formatAsCSV(data)}
\`\`\`

---

**Generated:** ${new Date().toISOString()}
**Analysis Script:** \`src/utils/taxbenefits/__tests__/analysis/equity-linearity-analysis.ts\`
`;

  return markdown;
}

/**
 * Main execution
 */
export function executeEquityLinearityAnalysis(): void {
  console.log('=== Equity % to Year 1 Tax Benefit Linearity Analysis ===\n');

  console.log('Running calculations for equity percentages 1% through 15%...\n');
  const data = runEquityLinearityAnalysis();

  console.log(`Completed ${data.length} data points.\n`);

  console.log('Performing linearity analysis...\n');
  const linearityAnalysis = analyzeLinearity(data);

  console.log('=== RESULTS ===\n');
  console.log(`Linear Relationship: ${linearityAnalysis.isLinear ? 'YES' : 'NO'}`);
  console.log(`R² = ${linearityAnalysis.rSquared.toFixed(6)}`);
  console.log(`Formula: Net Benefit = ${linearityAnalysis.intercept.toFixed(2)} + (${linearityAnalysis.slope.toFixed(2)} × Equity %)\n`);

  console.log('=== CSV DATA ===\n');
  console.log(formatAsCSV(data));
  console.log('\n');

  console.log('=== MARKDOWN REPORT ===\n');
  const markdown = generateMarkdownReport(data, linearityAnalysis);
  console.log(markdown);

  // Return data for potential programmatic use
  return;
}

// Execute directly
executeEquityLinearityAnalysis();
